import { useState, useEffect, useCallback, useRef } from 'react';
import { nodeApi, screenApi, uploadApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, DataTable, Modal,
  ConfirmDialog, FormInput, SelectInput, Loader
} from '../../components/common/Common.jsx';
import './NodesPage.css';

const TYPE_OPTIONS = [{ value:'folder', label:'📁 Folder' }, { value:'screen', label:'🖥️ Screen' }];
const DIFF_OPTIONS = [{ value:'beginner', label:'Beginner' }, { value:'intermediate', label:'Intermediate' }, { value:'advanced', label:'Advanced' }];
const STATUS_OPTS  = [{ value:'draft', label:'Draft' }, { value:'published', label:'Published' }, { value:'archived', label:'Archived' }];
const SCREEN_TYPE_OPTS = ['home','article','educational','topicGrid','3d','process','quiz','mixed'].map(v => ({ value:v, label:v }));

const EMPTY_FORM = {
  title: '', slug: '', type: 'folder', icon: '', description: '',
  thumbnail: '', parentId: null, order: 0, isPublished: true,
  meta: { difficulty: 'beginner', estimatedTime: 0, tags: '', searchKeywords: '' },
};

// ─── Inline Image Uploader ────────────────────────────────────────────────────
// Small upload button next to any URL field — uploads to R2, pastes URL back
function ImageUploadField({ label, value, onChange, folder = 'nodes/thumbnails' }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const toast   = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview instantly
    const localUrl = URL.createObjectURL(file);
    onChange(localUrl);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',     file);
      fd.append('category', 'thumbnail');
      fd.append('folder',   folder);
      const res = await uploadApi.single(fd);
      const url = res?.data?.url;
      if (url) {
        onChange(url);
        toast.success('Image uploaded');
      }
    } catch (err) {
      onChange(''); // clear local blob on error
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      {/* Preview */}
      {value && (
        <div className="img-preview-wrap">
          <img
            src={value}
            alt="preview"
            className="img-preview"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <button
            className="img-preview-remove"
            onClick={() => onChange('')}
            title="Remove"
          >✕</button>
        </div>
      )}

      <div className="img-upload-row">
        <input
          className="form-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste URL or upload →"
          style={{ flex: 1 }}
        />
        <button
          className={`img-upload-btn ${uploading ? 'uploading' : ''}`}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Upload image to R2"
        >
          {uploading ? <span className="upload-spin">⟳</span> : '📤 Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
    </div>
  );
}

// ─── Main NodesPage ───────────────────────────────────────────────────────────
export default function NodesPage() {
  const [nodes,       setNodes]       = useState([]);
  const [breadcrumb,  setBreadcrumb]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editNode,    setEditNode]    = useState(null);
  const [deleteNode,  setDeleteNode]  = useState(null);
  const [screenNode,  setScreenNode]  = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const { loading: saving, run }               = useApi();
  const { loading: deleting, run: runDel }     = useApi();
  const toast = useToast();

  const currentParentId = breadcrumb.length ? breadcrumb[breadcrumb.length - 1]._id : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (!currentParentId) {
        res = await nodeApi.getRoots();
        setNodes(res?.data?.nodes || []);
      } else {
        res = await nodeApi.getChildren(currentParentId);
        setNodes(res?.data?.children || []);
      }
    } catch { toast.error('Failed to load nodes'); }
    finally { setLoading(false); }
  // eslint-disable-next-line
  }, [currentParentId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, parentId: currentParentId });
    setEditNode(null);
    setShowForm(true);
  };

  const openEdit = (node) => {
    setEditNode(node);
    setForm({
      title:       node.title       || '',
      slug:        node.slug        || '',
      type:        node.type        || 'folder',
      icon:        node.icon        || '',
      description: node.description || '',
      thumbnail:   node.thumbnail   || '',
      parentId:    node.parentId    || null,
      order:       node.order       ?? 0,
      isPublished: node.isPublished ?? true,
      meta: {
        difficulty:     node.meta?.difficulty     || 'beginner',
        estimatedTime:  node.meta?.estimatedTime  || 0,
        tags:           (node.meta?.tags          || []).join(', '),
        searchKeywords: (node.meta?.searchKeywords|| []).join(', '),
      },
    });
    setShowForm(true);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setMeta  = (key, val) => setForm(f => ({ ...f, meta: { ...f.meta, [key]: val } }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload = {
      ...form,
      meta: {
        ...form.meta,
        tags:           form.meta.tags.split(',').map(t => t.trim()).filter(Boolean),
        searchKeywords: form.meta.searchKeywords.split(',').map(t => t.trim()).filter(Boolean),
      },
    };
    try {
      if (editNode) {
        await run(nodeApi.update, editNode._id, payload);
        toast.success('Node updated');
      } else {
        await run(nodeApi.create, payload);
        toast.success('Node created');
      }
      setShowForm(false);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    try {
      await runDel(nodeApi.delete, deleteNode._id);
      toast.success('Node unpublished');
      setDeleteNode(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const drillDown    = (node) => { if (node.hasChildren) setBreadcrumb(b => [...b, { _id: node._id, title: node.title }]); };
  const breadcrumbNav= (idx)  => setBreadcrumb(b => b.slice(0, idx));

  const COLS = [
    {
      key: 'thumbnail', label: '',
      render: (v, row) => (
        <div className="node-thumb">
          {v
            ? <img src={v} alt="" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            : null
          }
          <span style={{ display: v ? 'none' : 'flex', fontSize:18 }}>{row.icon || '📁'}</span>
        </div>
      ),
    },
    {
      key: 'title', label: 'Title',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <div style={{ fontSize:11, color:'var(--gray-400)', fontFamily:'var(--mono)' }}>{row.slug}</div>
        </div>
      ),
    },
    { key: 'type',        label: 'Type',       render: v => <Badge color={v==='screen'?'blue':'gray'}>{v}</Badge> },
    { key: 'hasChildren', label: 'Children',   render: v => v ? <Badge color="green">Has children</Badge> : '—' },
    { key: 'isPublished', label: 'Published',  render: v => <Badge color={v?'green':'red'}>{v?'Yes':'No'}</Badge> },
    { key: 'order',       label: 'Order',      render: v => <span style={{fontFamily:'var(--mono)',fontSize:12}}>{v}</span> },
    { key: 'meta',        label: 'Difficulty', render: v => v?.difficulty || '—' },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="table-actions" onClick={e => e.stopPropagation()} >
          {row.hasChildren && <Btn size="sm" variant="ghost" onClick={() => drillDown(row)}>Open →</Btn>}
          {row.type === 'screen' && <Btn size="sm" variant="ghost" onClick={() => setScreenNode(row)}>Screen</Btn>}
          <Btn size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={() => setDeleteNode(row)}>Del</Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in" >
      <PageHeader
        title="Nodes"
        desc="Navigation tree — folders and screen nodes"
        action={<Btn onClick={openCreate} icon="＋">New Node</Btn>}
      />

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="breadcrumb">
          <button className="bc-item" onClick={() => setBreadcrumb([])}>Root</button>
          {breadcrumb.map((b, i) => (
            <span key={b._id}>
              <span className="bc-sep"> / </span>
              <button className="bc-item" onClick={() => breadcrumbNav(i + 1)}>{b.title}</button>
            </span>
          ))}
        </div>
      )}

      <Card style={{minWidth:'100%'}}>
        <DataTable columns={COLS} data={nodes} loading={loading} onRow={n => n.hasChildren && drillDown(n)} />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editNode ? `Edit — ${editNode.title}` : 'Create Node'}
        width={660}
      >
        <div className="form-stack">

          {/* Row 1: Title + Slug */}
          <div className="form-row">
            <FormInput
              label="Title *"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Workshop Technology"
            />
            <FormInput
              label="Slug (auto-generated if blank)"
              value={form.slug}
              onChange={e => setField('slug', e.target.value)}
              placeholder="workshop-technology"
            />
          </div>

          {/* Row 2: Type + Icon + Order */}
          <div className="form-row-3">
            <SelectInput label="Type" value={form.type} onChange={e => setField('type', e.target.value)} options={TYPE_OPTIONS} />
            <FormInput   label="Icon (emoji)" value={form.icon} onChange={e => setField('icon', e.target.value)} placeholder="🔧" />
            <FormInput   label="Order" type="number" value={form.order} onChange={e => setField('order', Number(e.target.value))} />
          </div>

          {/* Thumbnail with upload */}
          <ImageUploadField
            label="Thumbnail"
            value={form.thumbnail}
            onChange={url => setField('thumbnail', url)}
            folder="nodes/thumbnails"
          />

          {/* Description */}
          <FormInput
            label="Description"
            type="textarea"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder="Short description shown in folder cards"
          />

          {/* Meta row */}
          <div className="form-row">
            <SelectInput
              label="Difficulty"
              value={form.meta.difficulty}
              onChange={e => setMeta('difficulty', e.target.value)}
              options={DIFF_OPTIONS}
            />
            <FormInput
              label="Est. Time (min)"
              type="number"
              value={form.meta.estimatedTime}
              onChange={e => setMeta('estimatedTime', Number(e.target.value))}
            />
          </div>

          <FormInput
            label="Tags (comma separated)"
            value={form.meta.tags}
            onChange={e => setMeta('tags', e.target.value)}
            placeholder="cnc, lathe, turning"
          />

          <FormInput
            label="Search Keywords (comma separated)"
            value={form.meta.searchKeywords}
            onChange={e => setMeta('searchKeywords', e.target.value)}
            placeholder="lathe machine, centre lathe, cnc turning"
          />

          {/* Published toggle */}
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={e => setField('isPublished', e.target.checked)}
            />
            <span>Published (visible in app)</span>
          </label>

          <div className="form-actions">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={handleSave} loading={saving}>
              {editNode ? 'Update Node' : 'Create Node'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Screen Manager */}
      {screenNode && (
        <ScreenManager
          node={screenNode}
          onClose={() => { setScreenNode(null); load(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteNode}
        onClose={() => setDeleteNode(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Unpublish Node"
        message={`Unpublish "${deleteNode?.title}"? It will be hidden from the app.`}
      />
    </div>
  );
}

// ─── ScreenManager ────────────────────────────────────────────────────────────
function ScreenManager({ node, onClose }) {
  const [screen,  setScreen]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('draft');
  const [type,    setType]    = useState('article');
  const { run, loading: saving } = useApi();
  const toast = useToast();

  useEffect(() => {
    screenApi.getByNode(node._id)
      .then(r => {
        const s = r?.data?.screen;
        setScreen(s);
        if (s) { setStatus(s.status || 'draft'); setType(s.screenType || 'article'); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [node._id]);

  const createScreen = async () => {
    try {
      const res = await run(screenApi.create, { nodeId: node._id, screenType: type, status });
      setScreen(res?.data?.screen);
      toast.success('Screen created');
    } catch (e) { toast.error(e.message); }
  };

  const saveStatus = async () => {
    try {
      await run(screenApi.setStatus, screen._id, status);
      await run(screenApi.update, screen._id, { screenType: type });
      setScreen(s => ({ ...s, status, screenType: type }));
      toast.success('Screen updated');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Modal open onClose={onClose} title={`Screen — ${node.title}`} width={500}>
      {loading ? <Loader center /> : !screen ? (
        <div style={{ textAlign:'center', padding:24 }}>
          <p style={{ marginBottom:16, color:'var(--gray-500)' }}>No screen linked to this node yet.</p>
          <div className="form-stack" style={{ maxWidth:320, margin:'0 auto', textAlign:'left' }}>
            <SelectInput label="Screen Type" value={type} onChange={e => setType(e.target.value)} options={['home','article','educational','topicGrid','3d','process','quiz','mixed'].map(v=>({value:v,label:v}))} />
            <SelectInput label="Initial Status" value={status} onChange={e => setStatus(e.target.value)} options={[{value:'draft',label:'Draft'},{value:'published',label:'Published'}]} />
            <Btn onClick={createScreen} loading={saving}>Create Screen</Btn>
          </div>
        </div>
      ) : (
        <div className="form-stack">
          {/* Screen info box */}
          <div className="screen-info-box">
            <div>
              <div className="screen-info-label">Screen ID</div>
              <div className="screen-info-id">{screen._id}</div>
            </div>
            <Badge color={screen.status==='published'?'green':screen.status==='archived'?'red':'amber'}>
              {screen.status}
            </Badge>
          </div>

          <div className="form-row">
            <SelectInput
              label="Screen Type"
              value={type}
              onChange={e => setType(e.target.value)}
              options={['home','article','educational','topicGrid','3d','process','quiz','mixed'].map(v=>({value:v,label:v}))}
            />
            <SelectInput
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              options={[{value:'draft',label:'Draft'},{value:'published',label:'Published'},{value:'archived',label:'Archived'}]}
            />
          </div>

          <div className="form-actions">
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            <Btn onClick={saveStatus} loading={saving}>Save Changes</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
