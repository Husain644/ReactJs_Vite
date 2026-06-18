import React, { useRef, useState, useEffect } from 'react';

function VideoCall() {
  const [pc, setPc] = useState(null);
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    setPc(peerConnection);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
    });

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ice candidate", event.candidate);
        // socket.emit("icecandidate", event.candidate)
      }
    };

    return () => {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      peerConnection.close();
    };
  }, []);

  const createOffer = async () => {
    if (!pc) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log(pc.localDescription);
  };

  return (
    <div>
      <p>Video Call Component</p>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
        <button onClick={createOffer}>Create Offer</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <p>Local Video</p>
          <video ref={localVideoRef} autoPlay playsInline muted
            style={{ width: 400, height: 400, backgroundColor: 'black' }} />
        </div>
        <div style={{ marginLeft: 10 }}>
          <p>Remote Video</p>
          <video ref={remoteVideoRef} autoPlay playsInline
            style={{ width: 400, height: 400, backgroundColor: 'black' }} />
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
