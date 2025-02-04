import Chat from "./components/chat/Chat";
import Login from "./components/login/Login"
import List from "./components/list/List";
import Notification from "./components/notification/Notification";  
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./components/login/lib/firebase";
import { useEffect } from "react";
import { useUserStore } from "./components/login/lib/userStore";
import { useChatStore } from "./components/login/lib/chatStore";
const App = () => {
  
  const{currentUser,isLoading,fetchUserInfo} = useUserStore();
  const{chatId} = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return() => {
      unSub();
    };
     
  }, [fetchUserInfo]);

  console.log(currentUser);
  if(isLoading) return <div className="loading">Loading...</div>

  return (
    <div className='container'>
      {currentUser ? (
        <>
          <List/>
          {chatId && <Chat/>}
        </>   
        ) : (
        <Login/>
      )}
      <Notification/>
    </div>
  );
};

export default App