import { io } from 'socket.io-client';
export async function GetSocket(senderId){
    const socket = io(`http://192.168.30.197:8000/whatsapp`,
        {
        extraHeaders: {
        extra: "some-value",
        myuserid:'68eb87e0754c8327d11004e0',
        Authorization: "Bearer my-secret-token"
    }})
        return socket
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
