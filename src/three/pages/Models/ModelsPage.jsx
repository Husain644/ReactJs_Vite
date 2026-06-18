import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { modelApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, DataTable, Drawer,
  ConfirmDialog, FormInput, SelectInput, SearchBar, Loader
} from '../../components/common/Common.jsx';
import './ModelsPage.css';

const CATS = ['machine','tool','component','assembly','material','process','other'].map(v=>({value:v,label:v}));
const EMPTY = {
  title:'', description:'', shortDescription:'', modelUrl:'', thumbnail:'', posterImage:'',
  cameraPosition:[2,3,5], cameraTarget:[0,0,0], scale:[1,1,1],
  rotation:{x:0,y:0,z:0}, category:'other', tags:'', annotations:[], meshConfig:[], animations:[],
};

export default function ModelsPage() {
  const [models,    setModels]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('');
  const [form,      setForm]      = useState({ ...EMPTY });
  const [editModel, setEditModel] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [delModel,  setDelModel]  = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const { run, loading: saving }  = useApi();
  const { run: runDel, loading: deleting } = useApi();
  const toast = useToast();

  const load = async (q = search, cat = category) => {
    setLoading(true);
    try {
      const params = {};
      if (q)   params.q        = q;
      if (cat) params.category = cat;
      const res = await modelApi.search(params);
      setModels(res?.data?.models || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ ...EMPTY }); setEditModel(null); setShowForm(true); };
  const openEdit   = (m) => {
    setEditModel(m);
    setForm({ ...EMPTY, ...m, tags: (m.tags||[]).join(', ') });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.modelUrl) { toast.error('Title and modelUrl are required'); return; }
    const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
    try {
      if (editModel) { await run(modelApi.update, editModel._id, payload); toast.success('Model updated'); }
      else           { await run(modelApi.create, payload);               toast.success('Model created'); }
      setShowForm(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    try { await runDel(modelApi.delete, delModel._id); toast.success('Model unpublished'); setDelModel(null); load(); }
    catch (e) { toast.error(e.message); }
  };

  const setVec = (key, idx, val) => setForm(f => {
    const arr = [...f[key]]; arr[idx] = Number(val); return { ...f, [key]: arr };
  });

  const COLS = [
    { key: 'thumbnail', label: '', render: (v, row) => (
      <div className="model-thumb" onClick={e => { e.stopPropagation(); setPreview(row); }}>
        {v ? <img src={v} alt="" /> : <span>🧊</span>}
      </div>
    )},
    { key: 'title', label: 'Title', render: (v,row) => (
      <div>
        <div style={{fontWeight:600}}>{v}</div>
        <div style={{fontSize:11,color:'var(--gray-400)',fontFamily:'var(--mono)'}}>{row.slug}</div>
      </div>
    )},
    { key: 'category',    label: 'Category', render: v => <Badge color="blue">{v}</Badge> },
    { key: 'isPublished', label: 'Status',   render: v => <Badge color={v?'green':'gray'}>{v?'Published':'Draft'}</Badge> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <div className="table-actions" onClick={e=>e.stopPropagation()}>
        <Btn size="sm" variant="ghost" onClick={() => setPreview(row)}>Preview</Btn>
        <Btn size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => setDelModel(row)}>Del</Btn>
      </div>
    )},
  ];

  return (
    <div className="fade-in">
      <PageHeader title="3D Models" desc="GLB/GLTF models with viewer config" action={
        <Btn onClick={openCreate} icon="＋">Add Model</Btn>
      }/>

      <div className="model-filters" style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search models..." />
        <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} style={{width:160}}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Btn variant="ghost" onClick={() => load(search, category)}>Search</Btn>
      </div>

      <Card>
        <DataTable columns={COLS} data={models} loading={loading} />
      </Card>

      {/* Form Drawer */}
      <Drawer open={showForm} onClose={() => setShowForm(false)} title={editModel ? 'Edit Model' : 'Add 3D Model'} width={540}>
        <div className="form-stack">
          <FormInput label="Title *" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          <FormInput label="GLB URL *" value={form.modelUrl} onChange={e=>setForm(f=>({...f,modelUrl:e.target.value}))} placeholder="https://..." />
          <FormInput label="Thumbnail URL" value={form.thumbnail} onChange={e=>setForm(f=>({...f,thumbnail:e.target.value}))} placeholder="https://..." />
          <FormInput label="Short Description" value={form.shortDescription} onChange={e=>setForm(f=>({...f,shortDescription:e.target.value}))} />
          <FormInput label="Description" type="textarea" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          <SelectInput label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} options={CATS} />
          <FormInput label="Tags (comma separated)" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="lathe, cnc" />

          <div className="form-group">
            <label className="form-label">Camera Position [x, y, z]</label>
            <div style={{display:'flex',gap:8}}>
              {form.cameraPosition.map((v,i) => (
                <input key={i} type="number" className="form-input" value={v} onChange={e=>setVec('cameraPosition',i,e.target.value)} step="0.1" />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Scale [x, y, z]</label>
            <div style={{display:'flex',gap:8}}>
              {form.scale.map((v,i) => (
                <input key={i} type="number" className="form-input" value={v} onChange={e=>setVec('scale',i,e.target.value)} step="0.1" />
              ))}
            </div>
          </div>

          {form.modelUrl && (
            <div>
              <div className="form-label" style={{marginBottom:8}}>Quick Preview</div>
              <ThreePreview url={form.modelUrl} height={200} />
            </div>
          )}

          <div className="form-actions">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={handleSave} loading={saving}>{editModel ? 'Update' : 'Create'}</Btn>
          </div>
        </div>
      </Drawer>

      {/* Preview Modal */}
      {preview && (
        <div className="model-preview-overlay" onClick={() => setPreview(null)}>
          <div className="model-preview-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{preview.title}</h3>
              <button className="modal-close" onClick={() => setPreview(null)}>✕</button>
            </div>
            <ThreePreview url={preview.modelUrl} height={400} cameraPos={preview.cameraPosition} />
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--gray-200)',fontSize:12,color:'var(--gray-500)'}}>
              {preview.shortDescription || preview.description}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!delModel} onClose={() => setDelModel(null)} onConfirm={handleDelete} loading={deleting}
        title="Unpublish Model" message={`Unpublish "${delModel?.title}"?`}
      />
    </div>
  );
}

// ─── Three.js GLB Preview ─────────────────────────────────────────────────────
function ThreePreview({ url, height = 300, cameraPos = [2, 3, 5] }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    if (!url || !mountRef.current) return;
    const el = mountRef.current;
    const w  = el.clientWidth;
    const h  = height;

    // Scene setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(...cameraPos);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    // Placeholder box while GLB loads
    const box  = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, wireframe: true })
    );
    scene.add(box);

    // Load GLB dynamically
    let mixer;
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(url, (gltf) => {
        scene.remove(box);
        scene.add(gltf.scene);
        // center model
        const bx = new THREE.Box3().setFromObject(gltf.scene);
        const center = bx.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
      }, undefined, () => {
        // on error keep wireframe box
      });
    }).catch(() => {});

    // Manual orbit via mouse drag — auto-rotate pauses while dragging
    let isDragging = false, prevX = 0, prevY = 0;
    const onDown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onUp   = ()  => { isDragging = false; };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      scene.rotation.y += dx * 0.01;
      scene.rotation.x += dy * 0.01;
      prevX = e.clientX; prevY = e.clientY;
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    // Animate
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!isDragging) scene.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    stateRef.current = { renderer, raf };

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.domElement.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [url]);

  return (
    <div ref={mountRef} style={{ width:'100%', height, borderRadius:8, overflow:'hidden', background:'#0d0f14', cursor:'grab' }}>
    </div>
  );
}
