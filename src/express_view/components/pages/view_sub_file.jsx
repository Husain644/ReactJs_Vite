import React,{useEffect,useState} from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import axios from 'axios';
import { getData } from "../utils/axios";
import { svgBack } from '../../assets/icons/svg_icons';
import deleteIcon from '../../assets/icons/deleteIcon.png'
import editIcon from '../../assets/icons/edit.png'
import deleteGif from '../../assets/icons/deleteGif.gif'

function View_sub_file() {
    const Navigation=useNavigate();
    const {category}=useParams();
    const [showAlert,setShowAlert]=useState(false)
    const [deleteFolder,setDeleteFolder]=useState('');
    const [data, setData] = useState([]);
        const fetchData = async () => {
            try {
                const result = await getData(`/html/categories/${category}`);
                setData(result.subFolders);
                
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    useEffect(() => {
        fetchData();
    }, [category]);

    function DeleteFile(url){
      axios.delete(url).then((res)=>{
      fetchData();
      }).catch((error)=>{
      alert(error)
      })
    }
  function goEditPage(params){
    Navigation('/edit',{state:params})  //fileUrl:`/html/getFile/${category}/${folderName}/${f}`
  }  

  return (
    <div className='container' style={{backgroundColor:'#fff',marginTop:0,padding:0}}>
       <div className='header'>
         <button onClick={()=>{Navigation(-1)}} className='btn'> 
            {svgBack}
         </button>
         <p className='viewTitle'>{category}</p>
       </div>
            {showAlert&&<div className='alertBox'>
                   <img src={deleteGif} className='deleteIcon'/>
                    <p className='viewTitle' style={{fontSize:18,backgroundColor:'#fff'}}> Do yow want to delete folder permanently ?</p>
                     <p style={{color:'#fff',fontSize:13,fontStyle:'italic'}}>it wll be delete folder and all content that inside this folder</p>
                    <div className='row-container' style={{marginTop:20}}>
                      <button className='btn' onClick={()=>{setShowAlert(false)}}>Cancel</button>
                      <button className='btn' onClick={()=>{DeleteFile(deleteFolder);setShowAlert(false)}}>Yes</button>
                    </div>
                  </div>
                    }
        <div className='row-container'>
        {
          data?.map((item,index)=>{
            const deleteUrlFolder=`/html/deleteFile/${category}/${item.folderName}/deleteFolder`
            return(
              <div key={index} className={index===0?'card card-index':'card'} style={{maxWidth:500,cursor:'default'}}>
                  <div className='row-container' style={{padding:0,maxHeight:30}}><p className='fileTitle'>{item.folderName}</p>
                    <img src={deleteIcon} style={{height:20,width:30,cursor:'pointer'}} 
                    onClick={()=>{
                      setShowAlert(true);
                      setDeleteFolder(deleteUrlFolder);
                    }} />  
                  </div>
                  <div  className={index===0?'link-cpntainer link-index':'link-cpntainer'}>
                    {
                      item.files?.map((f,ind)=>{
                        const DeleteFileUrl=`/html/deleteFile/${category}/${item.folderName}/${f}`
                       
                        return(
                             <div className='row-container' style={{padding:0,borderBottom:'1px solid #eaea'}} key={ind} >
                              <a key={ind} href={`${axios.defaults.baseURL}/html/getFile/${category}/${item.folderName}/${f}`}
                              target='_blank' className={index===0?'file-link file-index':'file-link'}>
                               <p className="p-bullet" style={{color:'blue',fontSize:15}}>{f}</p>      
                             </a>
                                <div style={{flexDirection:'row',display:'flex',alignItems:'center',gap:10}}>
                                        <img src={editIcon} style={{height:15,width:20,cursor:'pointer'}} 
                                     onClick={()=>{goEditPage({category,subFolder:item.folderName,f})}} />
                                     <img src={deleteIcon} style={{height:15,width:20,cursor:'pointer'}} 
                                     onClick={()=>{DeleteFile(DeleteFileUrl)}} />
                                </div>
                             </div>
                        )
                      })
                    }
                  </div>
              </div>
            )
          })
        }
        </div>
    </div>
  )
}

export default View_sub_file;

