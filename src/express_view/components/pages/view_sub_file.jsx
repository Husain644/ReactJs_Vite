import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getData } from "../utils/axios";
import { svgBack } from '../../assets/icons/svg_icons';
import deleteIcon from '../../assets/icons/deleteIcon.png';
import deleteGif from '../../assets/icons/deleteGif.gif';

function View_sub_file() {
  const Navigation = useNavigate();
  const { category } = useParams();
  const [showAlert, setShowAlert] = useState(false);
  const [deleteFolder, setDeleteFolder] = useState('');
  const [data, setData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const result = await getData(`/html/categories/${category}`);
      setData(result.subFolders);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function DeleteFile(url) {
    axios.delete(url).then(() => {
      fetchData();
    }).catch((error) => {
      alert(error);
    });
  }

  function goEditPage(params) {
    Navigation('/three/html/view/edit', { state: params });
  }

  return (
    <div className='container' style={{ backgroundColor: '#fff', marginTop: 0, padding: 0 }}>
      <div className='header'>
        <button onClick={() => Navigation(-1)} className='btn'>{svgBack}</button>
        <p className='viewTitle'>{category}</p>
      </div>

      {showAlert && (
        <div className='alertBox'>
          <div className='alertInner'>
            <img src={deleteGif} style={{ height: 36, width: 36 }} alt="delete" />
            <p style={{ fontSize: 14, fontWeight: 500, textAlign: 'center' }}>Delete folder?</p>
            <p style={{ fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 1.5 }}>
              This will permanently remove the folder and all files inside.
            </p>
            <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
              <button style={{ flex: 1, height: 30, borderRadius: 6, border: '0.5px solid #ddd', background: 'transparent', cursor: 'pointer' }}
                onClick={() => setShowAlert(false)}>Cancel</button>
              <button style={{ flex: 1, height: 30, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}
                onClick={() => { DeleteFile(deleteFolder); setShowAlert(false); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className='row-container-main'>
        {data?.map((item, index) => {
          const deleteUrlFolder = `/html/deleteFile/${category}/${item.folderName}/deleteFolder`;
          return (
            <div key={index} className='card-index' style={{ borderColor: index % 2 ? '#8cf779' : '#79aaf7' }}>
              <div className='card-index-header'>
                <p className='fileTitle'>{index + 1}. {item.folderName}</p>
                <img src={deleteIcon} style={{ height: 16, width: 16, cursor: 'pointer' }}
                  alt="delete"
                  onClick={() => { setShowAlert(true); setDeleteFolder(deleteUrlFolder); }} />
              </div>
              <div className='link-container'>
                {item.files?.map((f, ind) => {
                  const DeleteFileUrl = `/html/deleteFile/${category}/${item.folderName}/${f}`;
                  return (
                    <div className='file-row' key={ind} style={{ backgroundColor: Math.floor(ind / 3) % 2 ? '#fad7fa' : '#dedcdc' }}>
                      <a href={`${axios.defaults.baseURL}/html/getFile/${category}/${item.folderName}/${f}`}
                        target='_blank' rel="noopener noreferrer" className='file-link'>
                        <span style={{ color: '#000' }}> {ind + 1}. </span>{f}
                      </a>
                      <div className='file-actions'>
                        <button style={{ cursor: 'pointer', color: '#000', marginRight: '10px', border: 'none', backgroundColor: 'transparent' }}
                          onClick={() => goEditPage({ category, subFolder: item.folderName, f })}>
                          🖉
                        </button>
                        <button style={{ cursor: 'pointer', border: 'none', backgroundColor: 'transparent' }}
                          onClick={() => DeleteFile(DeleteFileUrl)}>
                          <p style={{ color: 'red', fontSize: '20px' }}>🗑</p>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default View_sub_file;
