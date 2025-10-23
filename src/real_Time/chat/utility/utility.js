import { io } from 'socket.io-client';
export async function GetSocket(senderId){
try {
      const socket = io(`${import.meta.env.VITE_SERVER_URL}/whatsapp`,
        {
        extraHeaders: {
        extra: "some-value",
        myuserid:'68eb87e0754c8327d11004e0',
        Authorization: "Bearer my-secret-token"
    }})
    console.log('socket is initilized')
        return socket
} catch (error) {
  console.log('error is - ',error)
}

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
