import React from 'react'
import ReactPlayer from 'react-player'

function VideoCall() {
    const [pc,setPc]=React.useState(null)
    const localVideoRef=React.useRef()
    const remoteVideoRef=React.useRef() 
    React.useEffect(()=>{
        const pc=new RTCPeerConnection({
            iceServers:[{urls:'stun:stun.l.google.com:19302'}]
        })
        setPc(pc)
        navigator.mediaDevices.getUserMedia({video:true,audio:true}).then((stream)=>{
            if(localVideoRef.current){
                localVideoRef.current.srcObject=stream
            }
            stream.getTracks().forEach(track=>{
                pc.addTrack(track,stream)
            }
            )
        })
        pc.ontrack=(event)=>{
            const [remoteStream]=event.streams
            if(remoteVideoRef.current){
                remoteVideoRef.current.srcObject=remoteStream
            }
        }
    },[])

  return (
    <div>
        <p>Video Call Component</p>
        <div style={{display:'flex',flexDirection:'row',justifyContent:'space-around'}}>
          
        </div>
        <div style={{display:'flex',alignItems:'center'}}>
            <div>
                <p>Local Video</p>
                <ReactPlayer ref={localVideoRef} autoPlay playsInline muted style={{width:600,height:600,backgroundColor:'black'}}></ReactPlayer>
            </div>
            <div style={{marginLeft:50}}>
                <p>Remote Video</p>
                <ReactPlayer src="https://www.youtube.com/watch?v=ZDiQWv-hjtw&t=3056s"
                autoPlay playsInline style={{width:600,height:600,backgroundColor:'black'}}></ReactPlayer>
            </div>
        </div>
        </div>
  )
}

export default VideoCall
