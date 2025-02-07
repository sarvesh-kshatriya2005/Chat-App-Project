import "./addUser.css";
import { db } from "../../../login/lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../login/lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const { currentUser } = useUserStore();

  // 🔍 Handle Search User
  const handleSearch = async (e) => {
    e.preventDefault();
    setUser(null);
    setError(null);
    
    const formData = new FormData(e.target);
    const username = formData.get("username").trim();

    if (!username) {
      setError("Enter a username!");
      return;
    }

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));

      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        const foundUser = querySnapShot.docs[0].data();

        // 🚫 Prevent adding self
        if (foundUser.id === currentUser.id) {
          setError("You can't add yourself.");
          return;
        }

        setUser(foundUser);
      } else {
        setError("User not found.");
        setUser(null);
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching.");
    }
  };

  // ➕ Handle Add User to Chat
  const handleAdd = async () => {
    if (!user) return;

    try {
      const chatRef = collection(db, "chats");
      const userChatsRef = collection(db, "userchats");

      // 🛑 Check if chat already exists
      const currentUserChatDoc = await getDoc(doc(userChatsRef, currentUser.id));
      const existingChats = currentUserChatDoc.exists() ? currentUserChatDoc.data().chats || [] : [];

      const chatExists = existingChats.some((c) => c.receiverId === user.id);

      if (chatExists) {
        setError("User is already in your chat list.");
        return;
      }

      // ✅ Create a new chat document
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // ✅ Ensure `userchats` doc exists before updating
      if (!currentUserChatDoc.exists()) {
        await setDoc(doc(userChatsRef, currentUser.id), { chats: [] });
      }

      const receiverUserChatDoc = await getDoc(doc(userChatsRef, user.id));
      if (!receiverUserChatDoc.exists()) {
        await setDoc(doc(userChatsRef, user.id), { chats: [] });
      }

      // ✅ Add chat references to both users
      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      setUser(null);
    } catch (err) {
      console.log(err);
      setError("Failed to add user.");
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="username" name="username" />
        <button>Search</button>
      </form>

      {error && <p className="error">{error}</p>}

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="avatar image" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add user</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
