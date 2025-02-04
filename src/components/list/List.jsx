import Chatlist from "./chatList/ChatList"
import "./list.css"
import UserInfo from "./userInfo/UserInfo"
const List = () => {
  return (
    <div className='list'>
      <UserInfo/>
      <Chatlist />
    </div>
  )
}


export default List