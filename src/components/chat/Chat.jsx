import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth"; // Import signOut for logout
import { auth } from "../login/lib/firebase"; // Import Firebase auth
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../login/lib/firebase";
import { useChatStore } from "../login/lib/chatStore";
import { useUserStore } from "../login/lib/userStore";

const Chat = () => {
  const [chat, setChat] = useState();
  const [openEmoji, setOpenEmoji] = useState(false);
  const [text, setText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const { currentUser } = useUserStore();
  const { chatId, user } = useChatStore();
  
  const endRef = useRef(null);

  // ✅ Fetch & Listen for Real-Time Block Status
  useEffect(() => {
    if (!user?.id || !currentUser?.id) return;

    const userRef = doc(db, "users", currentUser.id);
    const unSub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsBlocked(docSnap.data().blocked?.includes(user.id));
      }
    });

    return () => unSub();
  }, [user?.id, currentUser?.id]);

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    return () => unSub();
  }, [chatId]);

  // ✅ Handle emoji selection
  const handleEmoji = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // ✅ Handle sending a message (prevent if blocked)
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || isBlocked) return;

    if (!currentUser || !currentUser.id) {
      console.error("Current user is not defined");
      return;
    }

    const messageData = {
      senderId: currentUser.id,
      text,
      createdAt: new Date(),
    };

    setText(""); // Instantly clear input

    try {
      // ✅ Save message in Firebase
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });

      const userIDs = [currentUser.id, user?.id];

      for (const id of userIDs) {
        if (!id) continue;

        const userChatRef = doc(db, "userchats", id);
        const userChatSnapShot = await getDoc(userChatRef);

        if (userChatSnapShot.exists()) {
          const userChatsData = userChatSnapShot.data();
          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex >= 0) {
            userChatsData.chats[chatIndex] = {
              ...userChatsData.chats[chatIndex],
              lastMessage: text,
              isSeen: id === currentUser.id,
              updatedAt: new Date().toISOString(),
            };

            await updateDoc(userChatRef, { chats: userChatsData.chats });
          }
        }
      }
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };

  // ✅ Handle Block/Unblock User
  const handleBlockUser = async () => {
    if (!user) return;

    const userRef = doc(db, "users", currentUser.id);

    try {
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (userData.blocked.includes(user.id)) {
        await updateDoc(userRef, {
          blocked: arrayRemove(user.id),
        });
        setIsBlocked(false);
      } else {
        await updateDoc(userRef, {
          blocked: arrayUnion(user.id),
        });
        setIsBlocked(true);
      }
    } catch (err) {
      console.error("Error toggling block:", err);
    }
  };
  
  // ✅ Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully.");
      window.location.reload(); // Refresh page to go back to login
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <div className="chat">
      {/* Chat Header */}
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="avatar" />
          <div className="texts">
            <span>{user?.username || "Unknown User"}</span>
            <p>{user?.description || "No description available"}</p>
          </div>
        </div>

        {/* More Options Button */}
        <div className="more-options" onClick={() => setShowOptions(!showOptions)}>
          <img src="./more.png" alt="More Options" />
        </div>
      </div>

      {/* Options Popup */}
      {showOptions && (
        <div className="options-popup">
          <button onClick={handleBlockUser}>
            {isBlocked ? "Unblock User" : "Block User"}
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="center">
        {chat?.messages?.map((message, index) => {
          const isOwnMessage = message?.senderId === currentUser?.id;
          const senderAvatar = isOwnMessage ? currentUser?.avatar : user?.avatar;

          return (
            <div key={index} className={isOwnMessage ? "message own" : "message"}>
              <img src={senderAvatar || "./avatar.png"} alt="avatar" />
              <div className="texts">
                <p>{message.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef}></div>
      </div>

      {/* Chat Input */}
      <div className="bottom">
        <input
          type="text"
          placeholder={isBlocked ? "Can't send messages" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          disabled={isBlocked}
        />
        <div className="emoji-container">
          <img src="./emoji.png" alt="emoji picker" onClick={() => setOpenEmoji((prev) => !prev)} className="emoji-icon"/>
          {openEmoji && (
            <div className="emoji-picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button className="sendButton" onClick={handleSend} disabled={isBlocked}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
