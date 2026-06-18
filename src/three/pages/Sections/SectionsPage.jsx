import { useState, useEffect, useCallback } from 'react';
import { sectionApi, screenApi, nodeApi } from '../../api/services.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.jsx';
import {
  PageHeader, Btn, Card, Badge, DataTable, Drawer,
  ConfirmDialog, FormInput, SelectInput, Empty
} from '../../components/common/Common.jsx';
import SectionForm from './SectionForm.jsx';
import './SectionsPage.css';

const SECTION_TYPES = [
  'header','footer','heading','subheading','text','image','gallery','banner',
  'cards','accordion','timeline','stepper','table','formula','equation',
  'comparison','diagram','3dModel','video','audio','pdf','quiz',
  'tip','warning','button','links','divider','spacer','relatedTopics',
];

const TYPE_BADGE_COLOR = {
  heading:'blue', text:'gray', image:'green', cards:'blue',
  '3dModel':'amber', quiz:'amber', tip:'green', warning:'red',
};

export default function SectionsPage() {
  const [screenId,    setScreenId]    = useState('');
  const [sections,    setSections]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [deleteItem,  setDeleteItem]  = useState(null);
  const { run: runDel, loading: deleting } = useApi();
  const toast = useToast();

  const load = useCallback(async () => {
    if (!screenId.trim()) return;
    setLoading(true);
    try {
      const res = await sectionApi.getByScreen(screenId.trim());
      setSections(res?.data?.sections || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [screenId]);

  const handleDelete = async () => {
    try {
      await runDel(sectionApi.delete, deleteItem._id);
      toast.success('Section hidden');
      setDeleteItem(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const COLS = [
    { key: 'order', label: '#', render: v => <span style={{fontFamily:'var(--mono)',fontSize:12}}>{v}</span> },
    { key: 'type',  label: 'Type', render: v => <Badge color={TYPE_BADGE_COLOR[v]||'gray'}>{v}</Badge> },
    { key: 'variant', label: 'Variant', render: v => v || 'default' },
    { key: 'sectionKey', label: 'Key', render: v => v ? <span style={{fontFamily:'var(--mono)',fontSize:11}}>{v}</span> : '—' },
    { key: 'isLazy',  label: 'Lazy', render: v => v ? <Badge color="amber">lazy</Badge> : <Badge color="green">eager</Badge> },
    { key: 'isVisible', label: 'Visible', render: v => v ? '✓' : <span style={{color:'var(--red)'}}>hidden</span> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <div className="table-actions">
        <Btn size="sm" variant="ghost" onClick={() => setEditSection(row)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => setDeleteItem(row)}>Del</Btn>
      </div>
    )},
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Sections"
        desc="Content blocks — enter a Screen ID to manage its sections"
        action={
          <Btn onClick={() => setCreateOpen(true)} icon="＋" disabled={!screenId.trim()}>Add Section</Btn>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Screen ID"
              value={screenId}
              onChange={e => setScreenId(e.target.value)}
              placeholder="MongoDB ObjectId of the screen"
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <Btn onClick={load} loading={loading}>Load Sections</Btn>
          </div>
        </div>
      </Card>

      {sections.length > 0 && (
        <Card title={`Sections (${sections.length})`}>
          <DataTable columns={COLS} data={sections} loading={loading} />
        </Card>
      )}

      {/* Create Drawer */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Add Section" width={520}>
        <SectionForm
          screenId={screenId}
          onSaved={() => { setCreateOpen(false); load(); }}
        />
      </Drawer>

      {/* Edit Drawer */}
      <Drawer open={!!editSection} onClose={() => setEditSection(null)} title="Edit Section" width={520}>
        {editSection && (
          <SectionForm
            screenId={screenId}
            section={editSection}
            onSaved={() => { setEditSection(null); load(); }}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={deleting}
        title="Hide Section" message={`Hide "${deleteItem?.type}" section? It stays in DB and can be restored.`}
      />
    </div>
  );
}
