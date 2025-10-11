import React,{useState,useEffect, use} from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios';

function Edit_file() {
    const location=useLocation();
    const {category,subFolder,f}=location.state;
    const [fileUrlData,setFileUrlData]=useState({category,subFolder,f,
       fileContent:''
    });
    const [previewUrl,setPreviewUrl]=useState(`${axios.defaults.baseURL}/html/getFile/${category}/${subFolder}/${f}`);
    const [messages,setMessages]=useState('');
    const fetchFileContent=async()=>{
        try {
            const response=await axios.get(`${axios.defaults.baseURL}/html/getFile/${category}/${subFolder}/${f}`);
            setFileUrlData({...fileUrlData,fileContent:response.data});
        } catch (error) {
            setMessages(error.message)
        }}
    useEffect(()=>{
        fetchFileContent();
       
    },[])
  
  const sendData=async()=>{
    try {
        axios.patch(`${axios.defaults.baseURL}/html/updateFile/${category}/${subFolder}/${f}`,
            {textData:fileUrlData.fileContent,
            folderName:fileUrlData.category,
            subFolder:fileUrlData.subFolder,
            fileName:fileUrlData.f
            }
        
        ).then((res)=>{
          
            setPreviewUrl(`${axios.defaults.baseURL}${res.data.path}`)
            setMessages('File updated successfully')
            setTimeout(() => {
                setMessages('')
            }, 3000);
        })
    } catch (error) {
         setMessages('File updated failed')
           setTimeout(() => {
                setMessages(error.message)
            }, 3000);
    }}

  return (
    <div style={{backgroundColor:'#fff'}}>
        <div className='editor-header'>
            <p style={{ fontSize:18,fontWeight:'bold',width:150,height:20}}>Html File Editor</p>
             <input type="text" className='editor-input' value={fileUrlData.category} onChange={(e)=>{setFileUrlData({...fileUrlData,category:e.target.value})}}  placeholder='enter FolderName name'   />
             <input type="text" className='editor-input' value={fileUrlData.subFolder} onChange={(e)=>{setFileUrlData({...fileUrlData,folderName:e.target.value})}}  placeholder='enter subFolder name'   />
            <input type="text" className='editor-input' value={fileUrlData.f} onChange={(e)=>{setFileUrlData({...fileUrlData,f:e.target.value})}}  placeholder='enter file name'   />
        </div>
        <div className='editor-container'>
            <textarea value={fileUrlData.fileContent} onChange={(e)=>{setFileUrlData({...fileUrlData,fileContent:e.target.value})}}
            className='edotor-textarea' />
                <iframe title="preview" className='editor-iframe'
                srcDoc={fileUrlData.fileContent}>
                </iframe>
        </div>
     <div style={{display:'flex',width:'100%',flexDirection:'row',justifyContent:'space-between',backgroundColor:'#ccc',
    paddingLeft:20,paddingRight:20,borderTop:'1px solid #ccc'}}>
        <button  onClick={sendData} className='btn' style={{margin:10,minWidth:200}}>Save</button>
        <p style={{color:messages==='File updated successfully'?'green':'red',fontSize:18,alignSelf:'center',fontStyle:'italic'}}>
            {messages}
        </p>
        <a href={previewUrl} target='__blank' style={{fontSize:20,}}>see preview</a>
     </div>
    </div>
  )
}

export default Edit_file
