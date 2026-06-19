import { useState } from 'react';
import { screenApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, FormInput, SelectInput, Loader, NodeSelect
} from '../../components/common/Common.jsx';
import './ScreensPage.css';

const STATUS_OPTS = ['draft','published','archived'].map(v=>({value:v,label:v}));
const TYPE_OPTS   = ['home','article','educational','topicGrid','3d','process','quiz','mixed'].map(v=>({value:v,label:v}));
const PRESET_OPTS = ['default','industrial','blueprint','dark'].map(v=>({value:v,label:v}));
const CARD_OPTS   = ['flat','elevated','outlined'].map(v=>({value:v,label:v}));

export default function ScreensPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [screen,       setScreen]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [status,       setStatus]       = useState('draft');
  const [form,         setForm]         = useState({
    screenType:'article',
    theme:{ preset:'default', cardStyle:'flat', bg:'', accent:'' },
    seo:{ title:'', description:'' }
  });
  const { run, loading: saving } = useApi();
  const toast = useToast();

  const handleNodeSelect = async (node) => {
    setSelectedNode(node);
    setScreen(null);
    if (!node?._id) return;
    setLoading(true);
    try {
      const res = await screenApi.getByNode(node._id);
      const s   = res?.data?.screen;
      setScreen(s);
      if (s) {
        setStatus(s.status || 'draft');
        setForm({
          screenType: s.screenType || 'article',
          theme: s.theme || {},
          seo:   s.seo   || {},
        });
      }
    } catch { setScreen(null); }
    finally { setLoading(false); }
  };

  const createScreen = async () => {
    try {
      const res = await run(screenApi.create, { nodeId: selectedNode._id, ...form, status });
      setScreen(res?.data?.screen);
      toast.success('Screen created');
    } catch (e) { toast.error(e.message); }
  };

  const updateScreen = async () => {
    try {
      await run(screenApi.update, screen._id, form);
      await run(screenApi.setStatus, screen._id, status);
      setScreen(s => ({ ...s, status, ...form }));
      toast.success('Screen saved');
    } catch (e) { toast.error(e.message); }
  };

  const setTheme = (k, v) => setForm(f => ({ ...f, theme: { ...f.theme, [k]: v } }));
  const setSeo   = (k, v) => setForm(f => ({ ...f, seo:   { ...f.seo,   [k]: v } }));

  const copyId = (id) => { navigator.clipboard.writeText(id); toast.success('ID copied'); };

  return (
    <div className="fade-in">
      <PageHeader title="Screens" desc="One screen per node — controls layout type, theme, and SEO" />

      {/* Node picker — no more manual ID paste */}
      <Card style={{ marginBottom: 20 }}>
        <NodeSelect
          label="Select Node"
          placeholder="Search and pick a node to manage its screen…"
          value={selectedNode?._id}
          onChange={handleNodeSelect}
        />
      </Card>

      {loading && <Loader center />}

      {!loading && selectedNode && (
        <div className="screens-layout">

          {/* Left: Screen info + status */}
          <div className="screens-col screens-col-left">
            <Card title={screen ? 'Screen' : 'No Screen Yet'}>
              {screen ? (
                <div className="form-stack">
                  {/* ID with copy button */}
                  <div className="info-box">
                    <div className="info-box-row">
                      <span className="info-label">Screen ID</span>
                      <button className="info-copy-btn" onClick={() => copyId(screen._id)}>Copy</button>
                    </div>
                    <div className="info-value">{screen._id}</div>
                  </div>

                  <div className="info-box">
                    <div className="info-box-row">
                      <span className="info-label">Status</span>
                      <Badge color={screen.status==='published'?'green':screen.status==='archived'?'red':'amber'}>
                        {screen.status}
                      </Badge>
                    </div>
                    <div className="info-box-row" style={{marginTop:4}}>
                      <span className="info-label">Version</span>
                      <span className="info-value">v{screen.version}</span>
                    </div>
                    <div className="info-box-row" style={{marginTop:4}}>
                      <span className="info-label">Type</span>
                      <Badge color="blue">{screen.screenType}</Badge>
                    </div>
                  </div>

                  <SelectInput
                    label="Publish Status"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    options={STATUS_OPTS}
                  />
                </div>
              ) : (
                <div className="screens-empty">
                  <div className="screens-empty-icon">🖥️</div>
                  <p>No screen linked to <strong>{selectedNode.title}</strong> yet.</p>
                  <Btn onClick={createScreen} loading={saving} style={{marginTop:14}}>
                    Create Screen
                  </Btn>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Edit form */}
          {screen && (
            <div className="screens-col screens-col-right">
              <Card title="Screen Config">
                <div className="form-stack">
                  <SelectInput
                    label="Screen Type"
                    value={form.screenType}
                    onChange={e => setForm(f => ({...f, screenType: e.target.value}))}
                    options={TYPE_OPTS}
                  />

                  <div className="screens-section-label">Theme</div>
                  <div className="form-row">
                    <SelectInput label="Preset"     value={form.theme?.preset||'default'}    onChange={e=>setTheme('preset',e.target.value)}    options={PRESET_OPTS} />
                    <SelectInput label="Card Style" value={form.theme?.cardStyle||'flat'}     onChange={e=>setTheme('cardStyle',e.target.value)} options={CARD_OPTS} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">BG Color</label>
                      <div className="color-input-row">
                        <input type="color" value={form.theme?.bg||'#ffffff'} onChange={e=>setTheme('bg',e.target.value)} className="color-swatch" />
                        <input className="form-input" value={form.theme?.bg||''} onChange={e=>setTheme('bg',e.target.value)} placeholder="#ffffff" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Accent Color</label>
                      <div className="color-input-row">
                        <input type="color" value={form.theme?.accent||'#2563eb'} onChange={e=>setTheme('accent',e.target.value)} className="color-swatch" />
                        <input className="form-input" value={form.theme?.accent||''} onChange={e=>setTheme('accent',e.target.value)} placeholder="#2563eb" />
                      </div>
                    </div>
                  </div>

                  <div className="screens-section-label">SEO</div>
                  <FormInput label="SEO Title"       value={form.seo?.title||''}       onChange={e=>setSeo('title',e.target.value)} placeholder="Page title for sharing" />
                  <FormInput label="SEO Description" value={form.seo?.description||''} onChange={e=>setSeo('description',e.target.value)} type="textarea" placeholder="Brief description" />

                  <div className="form-actions">
                    <Btn onClick={updateScreen} loading={saving}>Save All Changes</Btn>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
