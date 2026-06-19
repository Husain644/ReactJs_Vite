import { useState, useCallback } from 'react';
import { sectionApi, screenApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, DataTable, Drawer,
  ConfirmDialog, NodeSelect, Loader
} from '../../components/common/Common.jsx';
import SectionForm from './SectionForm.jsx';
import './SectionsPage.css';

const TYPE_BADGE_COLOR = {
  heading:'blue', subheading:'blue', text:'gray', image:'green', gallery:'green',
  cards:'blue', banner:'purple', accordion:'gray', timeline:'gray',
  stepper:'purple', table:'gray', formula:'amber', '3dModel':'amber',
  video:'purple', pdf:'gray', quiz:'amber', tip:'green', warning:'red',
};

export default function SectionsPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [screenId,     setScreenId]     = useState('');
  const [screenInfo,   setScreenInfo]   = useState(null);
  const [sections,     setSections]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [editSection,  setEditSection]  = useState(null);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [deleteItem,   setDeleteItem]   = useState(null);
  const { run: runDel, loading: deleting } = useApi();
  const toast = useToast();

  const handleNodeSelect = async (node) => {
    setSelectedNode(node);
    setSections([]);
    setScreenId('');
    setScreenInfo(null);
    if (!node?._id) return;

    setLoading(true);
    try {
      // Get screen for this node
      const res = await screenApi.getByNode(node._id);
      const screen = res?.data?.screen;
      if (!screen) { toast.info('No screen linked to this node yet'); setLoading(false); return; }

      setScreenId(screen._id);
      setScreenInfo(screen);

      // Load sections
      const secRes = await sectionApi.getByScreen(screen._id);
      setSections(secRes?.data?.sections || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const reload = useCallback(async () => {
    if (!screenId) return;
    setLoading(true);
    try {
      const res = await sectionApi.getByScreen(screenId);
      setSections(res?.data?.sections || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [screenId]);

  const handleDelete = async () => {
    try {
      await runDel(sectionApi.delete, deleteItem._id);
      toast.success('Section hidden');
      setDeleteItem(null);
      reload();
    } catch (e) { toast.error(e.message); }
  };

  const copyId = (id) => { navigator.clipboard.writeText(id); toast.success('Copied'); };

  const COLS = [
    { key: 'order',  label: '#',       render: v => <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--gray-500)'}}>{v}</span> },
    { key: 'type',   label: 'Type',    render: v => <Badge color={TYPE_BADGE_COLOR[v]||'gray'}>{v}</Badge> },
    { key: 'variant',label: 'Variant', render: v => v !== 'default' ? v : <span style={{color:'var(--gray-400)'}}>default</span> },
    { key: 'sectionKey', label: 'Key', render: v => v ? <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--blue)'}}>{v}</span> : '—' },
    { key: 'isLazy',    label: 'Load',    render: v => v ? <Badge color="amber">lazy</Badge> : <Badge color="green">eager</Badge> },
    { key: 'isVisible', label: 'Visible', render: v => v
        ? <span style={{color:'var(--green)',fontWeight:600}}>✓</span>
        : <span style={{color:'var(--red)'}}>hidden</span>
    },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <div className="table-actions">
        <Btn size="sm" variant="ghost" onClick={() => setEditSection(row)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => setDeleteItem(row)}>Hide</Btn>
      </div>
    )},
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Sections"
        desc="Pick a node — its sections load automatically"
        action={
          <Btn onClick={() => setCreateOpen(true)} disabled={!screenId} icon="＋">
            Add Section
          </Btn>
        }
      />

      {/* Node picker */}
      <Card style={{ marginBottom: 20 }}>
        <NodeSelect
          label="Select Node"
          placeholder="Pick a node to load its sections…"
          value={selectedNode?._id}
          onChange={handleNodeSelect}
        />

        {/* Screen info pill — shown after selection */}
        {screenInfo && (
          <div className="sections-screen-pill">
            <div className="ssp-left">
              <span className="ssp-label">Screen</span>
              <span className="ssp-id">{screenInfo._id}</span>
            </div>
            <div className="ssp-right">
              <Badge color={screenInfo.status==='published'?'green':screenInfo.status==='archived'?'red':'amber'}>
                {screenInfo.status}
              </Badge>
              <Badge color="blue">{screenInfo.screenType}</Badge>
              <button className="info-copy-btn" onClick={() => copyId(screenInfo._id)}>Copy ID</button>
            </div>
          </div>
        )}
      </Card>

      {loading && <Loader center />}

      {!loading && screenId && (
        <Card title={`Sections — ${sections.length} block${sections.length !== 1 ? 's' : ''}`}>
          <DataTable columns={COLS} data={sections} loading={loading} />
        </Card>
      )}

      {!loading && selectedNode && !screenId && !loading && (
        <Card>
          <div style={{textAlign:'center',padding:'32px 16px',color:'var(--gray-400)'}}>
            <div style={{fontSize:32,marginBottom:12}}>📭</div>
            <div style={{fontWeight:600,marginBottom:6}}>No screen linked</div>
            <div style={{fontSize:13}}>Go to Screens page to create a screen for this node first.</div>
          </div>
        </Card>
      )}

      {/* Create */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Add Section" width={540}>
        <SectionForm screenId={screenId} onSaved={() => { setCreateOpen(false); reload(); }} />
      </Drawer>

      {/* Edit */}
      <Drawer open={!!editSection} onClose={() => setEditSection(null)} title="Edit Section" width={540}>
        {editSection && (
          <SectionForm screenId={screenId} section={editSection} onSaved={() => { setEditSection(null); reload(); }} />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={deleting}
        title="Hide Section"
        message={`Hide the "${deleteItem?.type}" section? It stays in the database and can be restored later.`}
      />
    </div>
  );
}
