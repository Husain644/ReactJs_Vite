import { io } from 'socket.io-client';
import axios from 'axios';

export function GetSocket(loginId) {
  try {
      const socket = io(`${import.meta.env.VITE_SERVER_URL}/whatsapp`, {
    path: "/socket.io",              // must match server
    transports: ["websocket", "polling"], // both
    withCredentials: false,
     query: {
      myuserid: loginId || "68eb87e0754c8327d11004e0",
      Authorization: "Bearer my-secret-token",
    },
  });

  socket.on("connect", () => {
    console.log("Connected and socketId: ", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Connection Error:", err.message);
  });

  return socket;
  } catch (error) {
    console.log('error is ' , error)
  }
}

export async function getAllusers(){
  const res=await axios.get(`${import.meta.env.VITE_SERVER_URL}/whatsapp/all`)
  const result=await res.data.allUser
  return result
}

export function formatChatTime(isoString) {
     if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
