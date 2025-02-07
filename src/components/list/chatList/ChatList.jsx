import AddUser from "./addUser/addUser";
import "./chatList.css";
import { useState, useEffect } from "react";
import { useUserStore } from "../../login/lib/userStore";
import { db } from "../../login/lib/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../login/lib/chatStore";
import Avatar from "../../Avatar";
const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [showList, setShowList] = useState(false); // Toggle list visibility

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id) return;

    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const items = res.data()?.chats || [];

      const promises = items
        .filter((item) => item.receiverId) // Only include chats with a valid receiver
        .map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.exists() ? userDocSnap.data() : null;
          return { ...item, user };
        });

      const chatData = await Promise.all(promises);
      setChats(
        chatData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    });

    return () => unSub();
  }, [currentUser?.id]);

  const handleSelect = async (chat) => {
    setShowList(false); // Hide chat list when a user is selected (mobile)
    const userChats = chats.map(({ user, ...rest }) => rest);
    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);

    if (chatIndex >= 0) {
      userChats[chatIndex].isSeen = true;

      const userChatRef = doc(db, "userchats", currentUser.id);
      try {
        await updateDoc(userChatRef, { chats: userChats });
        changeChat(chat.chatId, chat.user);
      } catch (err) {
        console.log(err);
      }
    }
  };

  // ✅ Filter chats: exclude blocked users & apply search filter
  const filteredChats = chats.filter(
    (c) =>
      !c.user?.blocked?.includes(currentUser.id) && // Exclude blocked users
      c.user.username.toLowerCase().includes(input.toLowerCase()) // Apply search filter
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="Search" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt="Add User"
          className="add"
          onClick={() => {
            if (!currentUser) return;
            setAddMode((prev) => !prev);
          }}
        />
      </div>

      {/* ✅ Display chats */}
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: chat?.isSeen ? "transparent" : "#3a3e85a5" }}
        >
          <Avatar username={chat.user.username} className="avatar"/>

          <div className="texts">
            <span>
              {chat.user?.blocked?.includes(currentUser.id)
                ? "Blocked User"
                : chat.user?.username}
            </span>
            <p class="lastMsg">{chat.lastMessage || "No message"}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default Chatlist;
