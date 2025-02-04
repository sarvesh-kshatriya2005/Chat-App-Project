import { useState } from "react";
import Chatlist from "./chatList/ChatList";
import UserInfo from "./userInfo/UserInfo";
import "./list.css";

const List = () => {
  const [showList, setShowList] = useState(true); // Default: List is shown

  const toggleList = () => {
    setShowList((prevState) => !prevState); // Toggle visibility of the list
  };

  return (
    <div className="list">
      {/* User Info Section */}
      <UserInfo />

      {/* Button to toggle the list */}
      <div className="toggleButton" onClick={toggleList}>
        <img
          src={showList ? "./arrowUp.png" : "./arrowDown.png"}
          alt="Toggle List"
        />
      </div>

      {/* Chat List Section */}
      <div className={`chatList ${showList ? "" : "hidden"}`}>
        <Chatlist />
      </div>
    </div>
  );
};

export default List;
