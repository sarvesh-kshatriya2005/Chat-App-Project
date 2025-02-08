import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth"; // Import signOut for logout
import { auth } from "../login/lib/firebase"; // Import Firebase auth
import "./chat.css";
import Avatar from "../Avatar";
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
  const [replyMessage, setReplyMessage] = useState(null); // Store the message being replied to
  const [userStatus, setUserStatus] = useState("offline"); // ✅ Track Online/Offline
  const emojiRef = useRef(null); // ✅ Create a reference for the emoji picker

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

  // ✅ Handle emoji selection
  const handleEmoji = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // ✅ Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setOpenEmoji(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    });

    return () => unSub();
  }, [chatId]);

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
      replyTo: replyMessage ? replyMessage.text : null, // Add reply message
      replySender: replyMessage ? replyMessage.senderId : null, // Add reply sender
    };

    setText(""); // Instantly clear input
    setReplyMessage(null); // Clear the reply message after sending

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
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

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

  // Handle Typing
  const handleTyping = async () => {
    if (!chatId || !currentUser) return;
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      typing: currentUser.id, // Set the user who is typing
    });
  };

  // Remove typing indicator when user stops typing
  const handleStopTyping = async () => {
    if (!chatId) return;
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, { typing: "" });
  };

  // Detect typing activity
  const handleInputChange = (e) => {
    setText(e.target.value);
    handleTyping();

    setTimeout(() => {
      handleStopTyping();
    }, 3000); // Stops typing status after 3 sec
  };

  // Handle message swipe for reply
  const handleSwipe = (message) => {
    if (!message.text) return; // Don't allow replies to empty messages
    setReplyMessage(message);
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <Avatar username={user.username} size={50} />
          <div className="texts">
            <span>{user?.username || "Unknown User"}</span>
            <p>{user?.description || "No description available"}</p>
          </div>
        </div>

        {/* More Options Button */}
        <div
          className="more-options"
          onClick={() => setShowOptions(!showOptions)}
        >
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
          const senderAvatar = isOwnMessage
            ? currentUser?.avatar
            : user?.avatar;

          return (
            <div
              key={index}
              className={isOwnMessage ? "message own" : "message"}
              onTouchStart={(e) => (e.target.startX = e.touches[0].clientX)} // Detect swipe start
              onTouchEnd={(e) => {
                if (e.changedTouches[0].clientX - e.target.startX > 50) {
                  // Detect swipe right
                  handleSwipe(message);
                }
              }}
              onDoubleClick={() => handleSwipe(message)} // Double-click to reply on desktop
            >
              <div className="texts">
                {message.replyTo && (
                  <div className="reply">
                    <span>
                      {message.replySender === currentUser.id ? "You" : "User"}{" "}
                      replied:
                    </span>
                    <p>{message.replyTo}</p>
                  </div>
                )}
                <p>{message.text}</p>
              </div>
              <p
                style={{
                  textAlign: "center",
                  fontStyle: "italic",
                  color: "gray",}}>
                {chat?.typing && chat?.typing !== currentUser.id
                  ? "Typing..."
                  : ""}
              </p>
            </div>
          );
        })}
        <div ref={endRef}></div>
      </div>

      {/* Chat Input */}
      <div className="bottom">
        {replyMessage && (
          <div className="reply-preview">
            <span>Replying to: {replyMessage.text}</span>
            <button onClick={() => setReplyMessage(null)}>✖</button>
          </div>
        )}
        <input
          type="text"
          placeholder={isBlocked ? "Can't send messages" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          disabled={isBlocked}
        />

        <div className="emoji-container" ref={emojiRef}>
          <img
            src="./emoji.png"
            alt="emoji picker"
            onClick={() => setOpenEmoji((prev) => !prev)}
            className="emoji-icon"
          />
          {openEmoji && (
            <div className="emoji-picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>

        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
