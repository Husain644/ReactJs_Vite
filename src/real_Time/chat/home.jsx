import React from 'react'
import { GetSocket } from './utility/utility.js'

function HomeChat() {
  const socket = GetSocket();
  console.log("Socket in home chat", socket.id);
  return (
    <div>
      <p>Home Chat Component</p>
    </div>
  )
}

export default HomeChat
