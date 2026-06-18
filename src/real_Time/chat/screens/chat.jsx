import React, { useEffect, useState, useRef } from 'react';
import { formatChatTime } from '../utility/utility';

const serverUrl = import.meta.env.VITE_SERVER_URL;

function ChatPage({ socket = null }) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [reciverSocketId, setReciverSocketId] = useState(null);
  const [show, setShow] = useState(false);
  const [inputText, setInputText] = useState({
    text: '',
    conversationId: '68e66b316f3ae4b2aab253f3',
    reciverId: '68eb7e57aa05fbe79c4ac98e',
    chattingWith: '_',
    dp: ''
  });

  const scrollRef = useRef(null);
  const [pc] = useState(
    new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
  );

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [users, setAllUsers] = useState([]);

  // ✅ Get Media
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && reciverSocketId) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: reciverSocketId
          });
        }
      };
      setShow(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  // ✅ Stop streaming
  const stopStream = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    setShow(false);
  };

  // ✅ Start Call
  const startCall = async () => {
    if (!reciverSocketId) {
      alert('Select a user or ensure reciverSocketId is available');
      return;
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { offer: pc.localDescription, to: reciverSocketId });
  };

  // ✅ Socket Listeners
  useEffect(() => {
    if (!socket) {
      console.log('socket is not initialized');
      return;
    }

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('message', (data) => {
      if (data.from) setReciverSocketId(data.from);
      setMessages(prev => [...prev, { text: data.text, sender: 'server', time: data.time }]);
    });

    socket.on('offer', async ({ offer, from }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer: pc.localDescription, to: from });
    });

    socket.on('answer', async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      pc.close();
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setIsConnected(false);
    };
  }, [socket, pc]);

  // ✅ Send Message
  const sendMessage = () => {
    if (!inputText.text.trim()) return;
    const data = {
      conversationId: inputText.conversationId,
      reciverId: inputText.reciverId,
      text: inputText.text.trim(),
      time: new Date().toISOString()
    };
    try {
      socket.emit('message', data);
    } catch (error) {
      console.log(error);
    }
    setMessages(prev => [...prev, { text: inputText.text, sender: 'me', time: data.time }]);
    setInputText(prev => ({ ...prev, text: '' }));
  };

  // ✅ Auto-scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // ✅ Fetch Users Initially
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`${serverUrl}/whatsapp/all`);
        const data = await response.json();
        setAllUsers(data.allUser);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div style={styles.containerMain}>
      <div style={{ width: "200px", background: "#eaea", margin: "40px", borderRadius: "10px", overflowY: "auto", maxHeight: "80vh", padding: "10px" }}>
        <p>all users list</p>
        {users.map((user) => (
          <div key={user._id}
            onClick={() => setInputText(prev => ({ ...prev, reciverId: user._id, chattingWith: user.name, dp: user.dp }))}
            style={{ borderBottom: "1px solid #ddd", flexDirection: "row", display: "flex", padding: "10px" }}>
            <img
              src={user.dp ? `${serverUrl}/whatsapp/static/assets/user/images/${user.dp}` : 'https://techtt.site/html/getFile/Assets/icons/profile-icon.jpg'}
              alt={user.name}
              style={{ width: 45, height: 45, borderRadius: 25, marginRight: 10 }}
            />
            <div>
              <p><strong>{user.name}</strong></p>
              <p style={{ fontSize: 12 }}>{user.phone}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.container}>
        <h2>React Chat Page</h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
          <button onClick={getMedia}>Ready to Call</button>
          <button onClick={startCall}>Start Call</button>
          <button onClick={stopStream}>Stop Streaming</button>
        </div>

        <div style={styles.infoBox}>
          <p>{inputText.chattingWith} ID: {inputText.reciverId || "Connecting..."}</p>
          <p style={{ display: 'flex', flexDirection: 'row' }}>
            Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"},
            <span style={{ fontSize: '12px' }}>socketId {reciverSocketId}</span>
          </p>
          <img
            src={`${serverUrl}/whatsapp/static/assets/user/images/${inputText.dp}`}
            alt="avatar" width={50} height={50}
            style={{ borderRadius: 25, position: 'absolute', top: -30, right: 5, backgroundColor: '#fff', padding: '2px' }}
          />
        </div>

        <div style={styles.chatBox} ref={scrollRef}>
          {messages.map((msg, index) => (
            <div key={index} style={{
              ...styles.message,
              alignSelf: msg.sender === "me" ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === "me" ? "#DCF8C6" : "#FFF",
            }}>
              <h5>{msg.text}</h5>
              <div style={{ fontSize: 10, textAlign: 'right', marginTop: 4, color: "#555" }}>
                {msg.time ? formatChatTime(msg.time) : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.inputBox}>
          <input
            style={styles.input}
            type="text"
            placeholder="Type a message..."
            value={inputText.text}
            onChange={(e) => setInputText(prev => ({ ...prev, text: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} style={styles.button}>Send</button>
        </div>
      </div>

      {show && (
        <div style={{ marginRight: 20 }}>
          <div>
            <p>Local Video</p>
            <video ref={localVideoRef} autoPlay playsInline muted
              style={{ width: 300, height: 200, backgroundColor: 'black' }} />
          </div>
          <div style={{ marginLeft: 0 }}>
            <p>Remote Video</p>
            <video ref={remoteVideoRef} autoPlay playsInline
              style={{ width: 300, height: 200, backgroundColor: 'black' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;

const styles = {
  containerMain: {
    display: "flex",
    justifyContent: "flex-start",
    maxHeight: "100vh",
    background: "#e2e2e2"
  },
  container: {
    width: "400px",
    margin: "40px auto",
    marginTop: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px",
    fontFamily: "Arial, sans-serif",
    background: "#999",
  },
  infoBox: {
    marginBottom: "15px",
    fontSize: "14px",
    color: "#444",
    position: 'relative'
  },
  chatBox: {
    height: "300px",
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "#f9f9f9",
  },
  message: {
    padding: "0px 12px",
    borderRadius: "8px",
    maxWidth: "70%",
  },
  inputBox: {
    marginTop: "15px",
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #888",
  },
  button: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#007bff",
    color: "#fff",
    cursor: "pointer",
  },
};
