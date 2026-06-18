import { useState, useRef } from 'react';
import { uploadApi } from '../../api/services.js';
import { useToast } from '../../hooks/useToast.jsx';
import { PageHeader, Btn, Card, Badge, FormInput, SelectInput } from '../../components/common/Common.jsx';
import './UploadPage.css';

const CATEGORIES = ['image','thumbnail','model','pdf','video','audio'].map(v=>({value:v,label:v}));
const SIZE_LIMITS = { image:'10MB', thumbnail:'2MB', model:'150MB', pdf:'50MB', video:'500MB', audio:'30MB' };

export default function UploadPage() {
  const [tab,       setTab]       = useState('single'); // single | many | presign
  const [category,  setCategory]  = useState('image');
  const [folder,    setFolder]    = useState('');
  const [file,      setFile]      = useState(null);
  const [files,     setFiles]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState([]);
  // presign
  const [psFilename, setPsFilename] = useState('');
  const [psMime,     setPsMime]     = useState('');
  const [psResult,   setPsResult]   = useState(null);
  // delete
  const [delKey,  setDelKey]  = useState('');
  const fileRef  = useRef();
  const filesRef = useRef();
  const toast    = useToast();

  const handleSingle = async () => {
    if (!file) { toast.error('Select a file'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file',     file);
      fd.append('category', category);
      fd.append('folder',   folder || 'misc');
      const res = await uploadApi.single(fd);
      setResults([res?.data, ...results]);
      toast.success('Uploaded!');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleMany = async () => {
    if (!files.length) { toast.error('Select files'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('category', category);
      fd.append('folder',   folder || 'misc');
      const res = await uploadApi.many(fd);
      setResults([...(res?.data?.files || []), ...results]);
      toast.success(`${res?.data?.count} files uploaded`);
      setFiles([]);
      if (filesRef.current) filesRef.current.value = '';
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handlePresign = async () => {
    if (!psFilename || !psMime) { toast.error('Filename and MIME type required'); return; }
    setLoading(true);
    try {
      const res = await uploadApi.presign({ filename: psFilename, mimeType: psMime, category, folder: folder || 'misc' });
      setPsResult(res?.data);
      toast.success('Presigned URL generated');
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!delKey.trim()) { toast.error('Enter a key'); return; }
    setLoading(true);
    try {
      await uploadApi.delete(delKey.trim());
      toast.success('File deleted from R2');
      setDelKey('');
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Upload Manager" desc="Upload files to Cloudflare R2" />

      <div className="upload-layout">
        <div>
          {/* Config */}
          <Card title="Upload Config" style={{ marginBottom:16 }}>
            <div className="form-stack">
              <div className="form-row">
                <SelectInput label="Category" value={category} onChange={e=>setCategory(e.target.value)} options={CATEGORIES} />
                <FormInput label="Folder path" value={folder} onChange={e=>setFolder(e.target.value)} placeholder="cnc/lathe" />
              </div>
              <div className="upload-size-note">
                Max size for <strong>{category}</strong>: {SIZE_LIMITS[category]}
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="upload-tabs">
            {['single','many','presign'].map(t => (
              <button key={t} className={`upload-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                {t === 'single' ? '📄 Single' : t === 'many' ? '📚 Multiple' : '🔗 Presigned URL'}
              </button>
            ))}
          </div>

          <Card>
            {tab === 'single' && (
              <div className="form-stack">
                <div
                  className="drop-zone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
                >
                  {file ? (
                    <div>
                      <div className="drop-filename">{file.name}</div>
                      <div className="drop-size">{(file.size/1024/1024).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <>
                      <div className="drop-icon">📤</div>
                      <div>Click or drag to upload</div>
                      <div className="drop-sub">Max {SIZE_LIMITS[category]}</div>
                    </>
                  )}
                  <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files[0])} />
                </div>
                <Btn onClick={handleSingle} loading={loading} disabled={!file}>Upload</Btn>
              </div>
            )}

            {tab === 'many' && (
              <div className="form-stack">
                <div className="drop-zone" onClick={() => filesRef.current?.click()}>
                  {files.length ? (
                    <div>
                      <div className="drop-filename">{files.length} file(s) selected</div>
                      <div className="drop-size">{files.map(f=>f.name).join(', ')}</div>
                    </div>
                  ) : (
                    <>
                      <div className="drop-icon">📚</div>
                      <div>Click to select multiple files (max 10)</div>
                    </>
                  )}
                  <input ref={filesRef} type="file" multiple hidden onChange={e => setFiles(Array.from(e.target.files))} />
                </div>
                <Btn onClick={handleMany} loading={loading} disabled={!files.length}>Upload All</Btn>
              </div>
            )}

            {tab === 'presign' && (
              <div className="form-stack">
                <p style={{fontSize:13,color:'var(--gray-500)'}}>
                  Generate a presigned URL for large files. Client uploads directly to R2 — never hits your server.
                </p>
                <FormInput label="Filename" value={psFilename} onChange={e=>setPsFilename(e.target.value)} placeholder="lathe-machine.glb" />
                <FormInput label="MIME Type" value={psMime} onChange={e=>setPsMime(e.target.value)} placeholder="model/gltf-binary" />
                <Btn onClick={handlePresign} loading={loading}>Generate URL</Btn>
                {psResult && (
                  <div className="presign-result">
                    <div className="ps-row">
                      <span className="ps-label">Upload URL</span>
                      <div className="ps-value mono">{psResult.uploadUrl.slice(0,60)}…</div>
                      <Btn size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(psResult.uploadUrl); toast.success('Copied'); }}>Copy</Btn>
                    </div>
                    <div className="ps-row">
                      <span className="ps-label">Public URL</span>
                      <div className="ps-value mono">{psResult.publicUrl}</div>
                      <Btn size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(psResult.publicUrl); toast.success('Copied'); }}>Copy</Btn>
                    </div>
                    <div className="ps-row">
                      <span className="ps-label">Expires in</span>
                      <span>{psResult.expiresIn}s</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Delete */}
          <Card title="Delete from R2" style={{ marginTop:16 }}>
            <div style={{display:'flex',gap:10}}>
              <FormInput
                label="R2 Key"
                value={delKey}
                onChange={e=>setDelKey(e.target.value)}
                placeholder="images/cnc/lathe/diagram.jpg"
              />
              <div style={{alignSelf:'flex-end'}}>
                <Btn variant="danger" onClick={handleDelete} loading={loading}>Delete</Btn>
              </div>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div>
          <Card title={`Uploaded (${results.length})`}>
            {results.length === 0
              ? <p style={{color:'var(--gray-400)',fontSize:13}}>No uploads yet this session</p>
              : results.map((r, i) => r && (
                <div key={i} className="upload-result">
                  {r.mimeType?.startsWith('image') && (
                    <img src={r.url} alt="" className="upload-thumb" />
                  )}
                  <div className="upload-result-info">
                    <div className="upload-url">{r.url}</div>
                    <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                      {r.category && <Badge color="blue">{r.category}</Badge>}
                      {r.size && <span style={{fontSize:11,color:'var(--gray-400)'}}>{(r.size/1024).toFixed(1)} KB</span>}
                    </div>
                  </div>
                  <Btn size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(r.url); toast.success('URL copied'); }}>Copy</Btn>
                </div>
              ))
            }
          </Card>
        </div>
      </div>
    </div>
  );
}
