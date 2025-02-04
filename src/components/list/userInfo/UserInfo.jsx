import "./userInfo.css";
import { useState } from "react";
import { useUserStore } from "../../login/lib/userStore";
import { auth, db } from "../../login/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const [showOptions, setShowOptions] = useState(false); // State to toggle options visibility

  // Handle Block User
  const handleBlock = async () => {
    const userDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(userDocRef, {
        blocked: currentUser.blocked.includes(currentUser.id)
          ? currentUser.blocked.filter((id) => id !== currentUser.id)
          : [...currentUser.blocked, currentUser.id],
      });
    } catch (err) {
      console.log("Error blocking user:", err);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    auth.signOut().catch((err) => console.log("Error signing out:", err));
  };

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="avatar" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img
          src="./more.png"
          alt="more options"
          onClick={() => setShowOptions(!showOptions)}
        />
      </div>

      {showOptions && (
        <div className="options">
          <button onClick={handleBlock}>
            {currentUser.blocked.includes(currentUser.id)
              ? "Unblock User"
              : "Block User"}
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
