import React,{useState,useEffect} from 'react'
import { GetSocket } from './utility/utility.js'
import Chat from './screens/chat.jsx'
import axios from 'axios';


function HomeChat() {
  const [socket, setSocket] = useState(null);
  const [user,SetUser]=useState({
    loginId:'',
    phone:'',
    name:''
  })
  const getLoginId=async ()=>{
   try {
   console.log('click')
   const res=await axios.get(`${import.meta.env.VITE_SERVER_URL}/whatsapp/user/phone/${user.phone}`)
   const Id=await res.data.user?._id
   const name=await res.data.user?.name
   const newSocket = GetSocket(Id);
   setSocket(newSocket);
   SetUser((prev)=>{return {...prev,loginId:Id,name:name}})
   } catch (error) {
    console.log('error on get user id',error)
   }
  }
    
  return (
    <>
     {
      user.loginId?
     <>
       <p> login as {user.name}</p>
       <Chat socket={socket}/>
     </>
       :<div style={styles.loginContainer}>
       <input placeholder='enter mobile number' style={styles.input} onChange={(e)=>{SetUser({...user,phone:e.target.value})}}/>
       <button style={styles.btn} onClick={getLoginId}>
        getUserData
       </button>
      </div>
     }
    </>
  )
}

const styles={
  loginContainer:{
   padding:10,
   display:'flex',
   flexDirection:'row',
   gap:10
  },
  input:{
   fontSize:15,
   padding:5
  },
  btn:{
    padding:5,
  }
}

export default HomeChat;
