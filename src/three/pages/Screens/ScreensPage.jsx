import { useState } from 'react';
import { screenApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import { PageHeader, Btn, Card, Badge, FormInput, SelectInput, Loader } from '../../components/common/Common.jsx';
import './ScreensPage.css';

const STATUS_OPTS  = ['draft','published','archived'].map(v=>({value:v,label:v}));
const TYPE_OPTS    = ['home','article','educational','topicGrid','3d','process','quiz','mixed'].map(v=>({value:v,label:v}));
const PRESET_OPTS  = ['default','industrial','blueprint','dark'].map(v=>({value:v,label:v}));
const CARD_OPTS    = ['flat','elevated','outlined'].map(v=>({value:v,label:v}));

export default function ScreensPage() {
  const [nodeId,  setNodeId]  = useState('');
  const [screen,  setScreen]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState('draft');
  const [form,    setForm]    = useState({ screenType:'article', theme:{ preset:'default', cardStyle:'flat', bg:'', accent:'' }, seo:{ title:'', description:'' } });
  const { run, loading: saving } = useApi();
  const toast = useToast();

  const loadScreen = async () => {
    if (!nodeId.trim()) return;
    setLoading(true);
    try {
      const res = await screenApi.getByNode(nodeId.trim());
      const s   = res?.data?.screen;
      setScreen(s);
      if (s) {
        setStatus(s.status || 'draft');
        setForm({ screenType: s.screenType || 'article', theme: s.theme || {}, seo: s.seo || {} });
      }
    } catch { setScreen(null); }
    finally { setLoading(false); }
  };

  const createScreen = async () => {
    try {
      const res = await run(screenApi.create, { nodeId: nodeId.trim(), ...form, status });
      setScreen(res?.data?.screen);
      toast.success('Screen created');
    } catch (e) { toast.error(e.message); }
  };

  const updateScreen = async () => {
    try {
      await run(screenApi.update, screen._id, form);
      toast.success('Screen updated');
    } catch (e) { toast.error(e.message); }
  };

  const publishScreen = async () => {
    try {
      await run(screenApi.setStatus, screen._id, status);
      setScreen(s => ({ ...s, status }));
      toast.success(`Screen set to ${status}`);
    } catch (e) { toast.error(e.message); }
  };

  const setTheme = (key, val) => setForm(f => ({ ...f, theme: { ...f.theme, [key]: val } }));
  const setSeo   = (key, val) => setForm(f => ({ ...f, seo:   { ...f.seo,   [key]: val } }));

  return (
    <div className="fade-in">
      <PageHeader title="Screens" desc="One screen per node — controls layout type, theme, and SEO" />

      <Card title="Lookup Screen by Node ID" style={{ marginBottom: 16 }}>
        <div style={{ display:'flex', gap:10 }}>
          <FormInput label="Node ID" value={nodeId} onChange={e => setNodeId(e.target.value)} placeholder="MongoDB ObjectId" />
          <div style={{ alignSelf:'flex-end' }}>
            <Btn onClick={loadScreen} loading={loading}>Load</Btn>
          </div>
        </div>
      </Card>

      {loading && <Loader center />}

      {!loading && nodeId && (
        <div className="screens-grid">
          {/* Screen info */}
          <Card title={screen ? 'Screen Config' : 'No Screen Found'}>
            {screen ? (
              <div className="screen-meta">
                <div className="sm-row"><span>ID</span><code>{screen._id}</code></div>
                <div className="sm-row"><span>Type</span><Badge color="blue">{screen.screenType}</Badge></div>
                <div className="sm-row"><span>Status</span><Badge color={screen.status==='published'?'green':screen.status==='archived'?'red':'gray'}>{screen.status}</Badge></div>
                <div className="sm-row"><span>Version</span>{screen.version}</div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:24 }}>
                <p style={{ color:'var(--gray-500)', marginBottom:16 }}>No screen linked to this node.</p>
                <Btn onClick={createScreen} loading={saving}>Create Screen</Btn>
              </div>
            )}
          </Card>

          {screen && (
            <>
              {/* Edit form */}
              <Card title="Edit Screen">
                <div className="form-stack">
                  <SelectInput label="Screen Type" value={form.screenType} onChange={e=>setForm(f=>({...f,screenType:e.target.value}))} options={TYPE_OPTS} />
                  <div className="form-row">
                    <SelectInput label="Theme Preset" value={form.theme?.preset||'default'} onChange={e=>setTheme('preset',e.target.value)} options={PRESET_OPTS} />
                    <SelectInput label="Card Style"   value={form.theme?.cardStyle||'flat'} onChange={e=>setTheme('cardStyle',e.target.value)} options={CARD_OPTS} />
                  </div>
                  <div className="form-row">
                    <FormInput label="BG Color" value={form.theme?.bg||''} onChange={e=>setTheme('bg',e.target.value)} placeholder="#ffffff" />
                    <FormInput label="Accent"   value={form.theme?.accent||''} onChange={e=>setTheme('accent',e.target.value)} placeholder="#2563eb" />
                  </div>
                  <FormInput label="SEO Title"       value={form.seo?.title||''}       onChange={e=>setSeo('title',e.target.value)} />
                  <FormInput label="SEO Description" value={form.seo?.description||''} onChange={e=>setSeo('description',e.target.value)} type="textarea" />
                  <div className="form-actions">
                    <Btn onClick={updateScreen} loading={saving}>Update</Btn>
                  </div>
                </div>
              </Card>

              {/* Publish */}
              <Card title="Publish Status">
                <div className="form-stack">
                  <SelectInput label="Status" value={status} onChange={e=>setStatus(e.target.value)} options={STATUS_OPTS} />
                  <Btn onClick={publishScreen} loading={saving}
                    variant={status==='published'?'success':status==='archived'?'danger':'ghost'}>
                    Set to {status}
                  </Btn>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
