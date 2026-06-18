import { useState, useEffect, useCallback } from 'react';
import { nodeApi, screenApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, DataTable, Modal,
  ConfirmDialog, FormInput, SelectInput, Empty, Loader
} from '../../components/common/Common.jsx';
import './NodesPage.css';

const TYPE_OPTIONS    = [{ value:'folder', label:'Folder' }, { value:'screen', label:'Screen' }];
const DIFF_OPTIONS    = [{ value:'beginner', label:'Beginner' }, { value:'intermediate', label:'Intermediate' }, { value:'advanced', label:'Advanced' }];
const STATUS_OPTIONS  = [{ value:'draft', label:'Draft' }, { value:'published', label:'Published' }, { value:'archived', label:'Archived' }];

const EMPTY_FORM = { title:'', slug:'', type:'folder', icon:'', description:'', parentId:null, meta:{ difficulty:'beginner', estimatedTime:0, tags:'' } };

export default function NodesPage() {
  const [nodes,      setNodes]      = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);   // [{_id, title}]
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editNode,   setEditNode]   = useState(null);
  const [deleteNode, setDeleteNode] = useState(null);
  const [screenNode, setScreenNode] = useState(null); // node to manage screen
  const [showForm,   setShowForm]   = useState(false);
  const { loading: saving, run }    = useApi();
  const { loading: deleting, run: runDel } = useApi();
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
      title: node.title, slug: node.slug, type: node.type,
      icon: node.icon || '', description: node.description || '',
      parentId: node.parentId || null,
      meta: { difficulty: node.meta?.difficulty || 'beginner', estimatedTime: node.meta?.estimatedTime || 0, tags: (node.meta?.tags || []).join(', ') }
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload = {
      ...form,
      meta: { ...form.meta, tags: form.meta.tags.split(',').map(t => t.trim()).filter(Boolean) }
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

  const drillDown = (node) => {
    if (node.hasChildren) {
      setBreadcrumb(b => [...b, { _id: node._id, title: node.title }]);
    }
  };

  const breadcrumbNav = (idx) => {
    setBreadcrumb(b => b.slice(0, idx));
  };

  const COLS = [
    { key: 'icon',  label: '',     render: (v) => <span style={{fontSize:20}}>{v || '📁'}</span> },
    { key: 'title', label: 'Title',render: (v, row) => (
      <div>
        <div style={{fontWeight:600}}>{v}</div>
        <div style={{fontSize:11,color:'var(--gray-400)',fontFamily:'var(--mono)'}}>{row.slug}</div>
      </div>
    )},
    { key: 'type',        label: 'Type',   render: v => <Badge color={v==='screen'?'blue':'gray'}>{v}</Badge> },
    { key: 'hasChildren', label: 'Children', render: v => v ? <Badge color="green">Has children</Badge> : '—' },
    { key: 'meta',        label: 'Difficulty', render: v => v?.difficulty || '—' },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <div className="table-actions" onClick={e => e.stopPropagation()}>
        {row.hasChildren && (
          <Btn size="sm" variant="ghost" onClick={() => drillDown(row)}>Open →</Btn>
        )}
        {row.type === 'screen' && (
          <Btn size="sm" variant="ghost" onClick={() => setScreenNode(row)}>Screen</Btn>
        )}
        <Btn size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => setDeleteNode(row)}>Del</Btn>
      </div>
    )},
  ];

  return (
    <div className="fade-in">
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

      <Card>
        <DataTable columns={COLS} data={nodes} loading={loading} onRow={n => n.hasChildren && drillDown(n)} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editNode ? 'Edit Node' : 'Create Node'} width={600}>
        <div className="form-stack">
          <div className="form-row">
            <FormInput label="Title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Workshop Technology" />
            <FormInput label="Slug (auto-generated)" value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} placeholder="workshop-technology" />
          </div>
          <div className="form-row">
            <SelectInput label="Type" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} options={TYPE_OPTIONS} />
            <FormInput label="Icon (emoji)" value={form.icon} onChange={e => setForm(f => ({...f, icon: e.target.value}))} placeholder="🔧" />
          </div>
          <FormInput label="Description" type="textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          <div className="form-row">
            <SelectInput label="Difficulty" value={form.meta.difficulty} onChange={e => setForm(f => ({...f, meta:{...f.meta, difficulty: e.target.value}}))} options={DIFF_OPTIONS} />
            <FormInput label="Est. Time (min)" type="number" value={form.meta.estimatedTime} onChange={e => setForm(f => ({...f, meta:{...f.meta, estimatedTime: Number(e.target.value)}}))} />
          </div>
          <FormInput label="Tags (comma separated)" value={form.meta.tags} onChange={e => setForm(f => ({...f, meta:{...f.meta, tags: e.target.value}}))} placeholder="cnc, lathe, turning" />
          <div className="form-actions">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={handleSave} loading={saving}>{editNode ? 'Update' : 'Create'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Screen Manager */}
      {screenNode && <ScreenManager node={screenNode} onClose={() => { setScreenNode(null); load(); }} />}

      <ConfirmDialog
        open={!!deleteNode} onClose={() => setDeleteNode(null)} onConfirm={handleDelete} loading={deleting}
        title="Unpublish Node" message={`Unpublish "${deleteNode?.title}"? It will be hidden from the app.`}
      />
    </div>
  );
}

// ─── ScreenManager ────────────────────────────────────────────────────────────
function ScreenManager({ node, onClose }) {
  const [screen,   setScreen]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('');
  const { run, loading: saving } = useApi();
  const toast = useToast();
  const STATUS_OPTS = [{ value:'draft',label:'Draft' },{ value:'published',label:'Published' },{ value:'archived',label:'Archived' }];
  const TYPE_OPTS   = ['home','article','educational','topicGrid','3d','process','quiz','mixed'].map(v => ({value:v,label:v}));

  useEffect(() => {
    screenApi.getByNode(node._id)
      .then(r => { setScreen(r?.data?.screen); setStatus(r?.data?.screen?.status || 'draft'); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [node._id]);

  const createScreen = async () => {
    try {
      const res = await run(screenApi.create, { nodeId: node._id, screenType: 'article', status: 'draft' });
      setScreen(res?.data?.screen);
      toast.success('Screen created');
    } catch (e) { toast.error(e.message); }
  };

  const publish = async () => {
    try {
      await run(screenApi.setStatus, screen._id, status);
      toast.success(`Screen ${status}`);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Modal open onClose={onClose} title={`Screen — ${node.title}`} width={500}>
      {loading ? <Loader center /> : !screen ? (
        <div style={{textAlign:'center',padding:24}}>
          <p style={{marginBottom:16,color:'var(--gray-500)'}}>No screen linked to this node yet.</p>
          <Btn onClick={createScreen} loading={saving}>Create Screen</Btn>
        </div>
      ) : (
        <div className="form-stack">
          <div style={{display:'flex',gap:12,alignItems:'center',padding:'12px',background:'var(--gray-50)',borderRadius:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:'var(--gray-500)'}}>Screen ID</div>
              <div style={{fontFamily:'var(--mono)',fontSize:12}}>{screen._id}</div>
            </div>
            <Badge color={screen.status==='published'?'green':screen.status==='archived'?'red':'gray'}>{screen.status}</Badge>
          </div>
          <div className="form-row">
            <SelectInput label="Status" value={status} onChange={e => setStatus(e.target.value)} options={STATUS_OPTS} />
          </div>
          <div className="form-actions">
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            <Btn onClick={publish} loading={saving}>Save Status</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
