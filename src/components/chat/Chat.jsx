import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth"; // Import signOut for logout
import { auth } from "../login/lib/firebase"; // Import Firebase auth
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../login/lib/firebase";
import { useChatStore } from "../login/lib/chatStore";
import { useUserStore } from "../login/lib/userStore";

const Chat = () => {
  const [chat, setChat] = useState();
  const [openEmoji, setOpenEmoji] = useState(false);
  const [text, setText] = useState("");
  const [showOptions, setShowOptions] = useState(false); // For toggling the options
  const endRef = useRef(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  // Auto-scroll to the latest message
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    return () => unSub();
  }, [chatId]);

  // Handle emoji selection
  const handleEmoji = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // Handle sending a message
  const handleSend = async (e) => {
    e?.preventDefault();

    // Prevent sending message if either user is blocked
    if (isCurrentUserBlocked || isReceiverBlocked) {
      console.log("You or the receiver is blocked. Cannot send message.");
      return;
    }

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

  // Handle Block User
  const handleBlockUser = async () => {
    try {
      const userRef = doc(db, "users", user.id); // Reference to the user to block
      await updateDoc(userRef, {
        blocked: arrayUnion(currentUser.id), // Add current user to blocked list
      });
      console.log(`User ${user.username} has been blocked.`);
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      console.log("User logged out successfully.");
      window.location.reload(); // Refresh to go back to login page (or redirect as per your logic)
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
          <button onClick={handleBlockUser}>Block User</button>
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
          placeholder={isCurrentUserBlocked || isReceiverBlocked ? "Can't send messages" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji-container">
          <img src="./emoji.png" alt="emoji picker" onClick={() => setOpenEmoji((prev) => !prev)} className="emoji-icon"/>
          {openEmoji && (
            <div className="emoji-picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
