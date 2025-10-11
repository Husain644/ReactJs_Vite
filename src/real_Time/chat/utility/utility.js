import { io } from 'socket.io-client';
export function GetSocket(senderId){
    const socket = io(`http://192.168.30.197:8000/whatsapp`,
        {
        extraHeaders: {
        extra: "some-value",
        senderId:senderId||'68e49248b0c7fda44c44a69a',
        myuserid:'68e49248b0c7fda44c44a69a',
        Authorization: "Bearer my-secret-token"
    }})
        return socket
}