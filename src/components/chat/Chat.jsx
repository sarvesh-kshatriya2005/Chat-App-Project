import { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../login/lib/firebase";
import { useChatStore } from "../login/lib/chatStore";
import { useUserStore } from "../login/lib/userStore";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  // Auto-scroll to the last message when chat updates
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    return () => unSub();
  }, [chatId]);

  // Handle emoji selection
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  // Send Message Function
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    if (!currentUser || !currentUser.id) {
      console.error("Current user is not defined");
      return;
    }

    const messageData = {
      senderId: currentUser.id,
      text,
      createdAt: new Date(),
    };

    setText(""); // Instantly clear the input field after sending

    try {
      // Update the chat messages in Firebase
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });

      const userIDs = [currentUser.id, user?.id];

      for (const id of userIDs) {
        if (!id) continue;

        const userChatRef = doc(db, "userchats", id);
        const userChatSnapShot = await getDoc(userChatRef);

        if (!userChatSnapShot.exists()) {
          await setDoc(userChatRef, { chats: [] });
        }

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

  return (
    <div className="chat">

      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="avatar" />
          <div className="texts">
            <span>{user?.username || "Unknown User"}</span>
            <p>{user?.description || "No description available"}</p>
          </div>
        </div>
        <div className="icons">
        </div>
      </div>

      <div className="center">
        {chat?.messages?.map((message, index) => {
          const isOwnMessage = message?.senderId === currentUser?.id;
          return (
            <div key={index} className={isOwnMessage ? "message own" : "message"}>
              <img src="./avatar.png"alt="avatar" />
              <div className="texts">
                <p>{message.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef}></div>
      </div>


      <div className="bottom">
        <input
          type="text"
          placeholder={isCurrentUserBlocked || isReceiverBlocked ? "Can't send messages" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img src="./emoji.png" alt="emoji picker" onClick={() => setOpen((prev) => !prev)} />
          {open && <EmojiPicker onEmojiClick={handleEmoji} />}
        </div>
        <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
