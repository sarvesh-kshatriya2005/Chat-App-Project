import Chat from "./components/chat/Chat";
import Login from "./components/login/Login";
import List from "./components/list/List";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./components/login/lib/firebase";
import { useEffect } from "react";
import { useUserStore } from "./components/login/lib/userStore";
import { useChatStore } from "./components/login/lib/chatStore";
import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./components/login/lib/firebase";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  const updateUserStatus = async (status) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { status, lastSeen: serverTimestamp() });
  };
  
  useEffect(() => {
    updateUserStatus("online");

    const handleOffline = () => updateUserStatus("offline");

    window.addEventListener("beforeunload", handleOffline);
    return () => {
      updateUserStatus("offline");
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, []);
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  console.log(currentUser);
  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
