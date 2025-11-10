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
        pc.onicecandidate=(event)=>{
            if(event.candidate){
                console.log("ice candidate runn")
                // socket.emit("icecandidate",event.candidate)
            }
        } 
    },[])

const CreateOffer=async()=>{
    const res=await pc.createOffer()
    await pc.setLocalDescription(res)
    const result=await pc.localDescription
    console.log(result) 
}


  return (
    <div>
        <p>Video Call Component</p>
        <div style={{display:'flex',flexDirection:'row',justifyContent:'space-around'}}>
          <button onClick={CreateOffer}>create offer</button>
        </div>
        <div style={{display:'flex',alignItems:'center'}}>
            <div>
                <p>Local Video</p>
                <ReactPlayer ref={localVideoRef} autoPlay playsInline muted style={{width:400,height:400,backgroundColor:'black'}}></ReactPlayer>
            </div>
            <div style={{marginLeft:10}}>
                <p>Remote Video</p>
                <ReactPlayer 
                ref={remoteVideoRef}
                autoPlay playsInline style={{width:400,height:400,backgroundColor:'black'}}></ReactPlayer>
            </div>
        </div>
        </div>
  )
}

export default VideoCall
