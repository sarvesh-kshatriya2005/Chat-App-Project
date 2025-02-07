import "./userInfo.css";
import { useState } from "react";
import { useUserStore } from "../../login/lib/userStore";
import { auth, db } from "../../login/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import Avatar from "../../Avatar";
const UserInfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <Avatar username={currentUser.username} size={50} />
        <h2>{currentUser.username}</h2>
      </div>
    </div>
  );
};

export default UserInfo;
