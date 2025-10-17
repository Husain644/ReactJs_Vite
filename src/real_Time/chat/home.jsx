import React,{useState,useEffect} from 'react'
import { GetSocket } from './utility/utility.js'
import Chat from './screens/chat.jsx'

function HomeChat() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    async function initializeSocket() {
      const newSocket = await GetSocket();
      setSocket(newSocket);
    } 
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <div>
      <p>Home Chat Component</p>
      <Chat socket={socket}/>
    </div>
  )
}

export default HomeChat;
