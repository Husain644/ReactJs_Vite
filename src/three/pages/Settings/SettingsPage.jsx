import { PageHeader, Card, Badge } from '../../components/common/Common.jsx';

export default function SettingsPage() {
  const API = 'https://www.techtt.site/three/api';
  const routes = [
    { method:'GET',    path:'/nodes',                  desc:'Root nodes' },
    { method:'POST',   path:'/nodes',                  desc:'Create node' },
    { method:'GET',    path:'/nodes/slug/:slug',        desc:'Screen load (main app endpoint)' },
    { method:'GET',    path:'/nodes/:id/children',      desc:'Children (paginated)' },
    { method:'PUT',    path:'/nodes/:id',               desc:'Update node' },
    { method:'DELETE', path:'/nodes/:id',               desc:'Soft delete node' },
    { method:'POST',   path:'/screens',                 desc:'Create screen' },
    { method:'GET',    path:'/screens/node/:nodeId',    desc:'Get screen by node' },
    { method:'PUT',    path:'/screens/:id',             desc:'Update screen' },
    { method:'PATCH',  path:'/screens/:id/status',      desc:'Publish/archive screen' },
    { method:'POST',   path:'/sections',                desc:'Create section' },
    { method:'POST',   path:'/sections/bulk',           desc:'Bulk create sections' },
    { method:'GET',    path:'/sections/screen/:screenId',desc:'Get sections by screen' },
    { method:'GET',    path:'/sections/:id',            desc:'Lazy fetch section data' },
    { method:'PATCH',  path:'/sections/reorder',        desc:'Reorder sections (bulkWrite)' },
    { method:'PUT',    path:'/sections/:id',            desc:'Update section' },
    { method:'DELETE', path:'/sections/:id',            desc:'Soft delete section' },
    { method:'POST',   path:'/quizzes',                 desc:'Create quiz' },
    { method:'GET',    path:'/quizzes/:id',             desc:'Get quiz (no answers)' },
    { method:'POST',   path:'/quizzes/:id/submit',      desc:'Submit quiz answers' },
    { method:'PUT',    path:'/quizzes/:id',             desc:'Update quiz' },
    { method:'POST',   path:'/models',                  desc:'Create 3D model' },
    { method:'GET',    path:'/models/search',           desc:'Search models' },
    { method:'GET',    path:'/models/:id',              desc:'Get model by ID' },
    { method:'PUT',    path:'/models/:id',              desc:'Update model' },
    { method:'POST',   path:'/upload/single',           desc:'Upload single file' },
    { method:'POST',   path:'/upload/many',             desc:'Upload multiple files' },
    { method:'POST',   path:'/upload/presign',          desc:'Generate presigned URL' },
    { method:'DELETE', path:'/upload',                  desc:'Delete file from R2' },
  ];

  const METHOD_COLOR = { GET:'green', POST:'blue', PUT:'amber', PATCH:'amber', DELETE:'red' };

  return (
    <div className="fade-in">
      <PageHeader title="Settings" desc="API reference and project configuration" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title="API Configuration">
          <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'var(--gray-500)' }}>Base URL</span>
              <code style={{ fontFamily:'var(--mono)', fontSize:11, background:'var(--gray-100)', padding:'2px 8px', borderRadius:4 }}>{API}</code>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'var(--gray-500)' }}>Stack</span>
              <span>Express + MongoDB + Mongoose</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'var(--gray-500)' }}>Assets</span>
              <span>Cloudflare R2</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'var(--gray-500)' }}>Modules</span>
              <span>ES Modules (import/export)</span>
            </div>
          </div>
        </Card>

        <Card title="Architecture">
          <div style={{ fontFamily:'var(--mono)', fontSize:12, lineHeight:2, color:'var(--gray-600)' }}>
            <div>Node (tree navigation)</div>
            <div>&nbsp;&nbsp;└── Screen (layout config)</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Section[] (content)</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Quiz (standalone)</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Model3D (standalone)</div>
          </div>
        </Card>
      </div>

      <Card title={`API Routes (${routes.length})`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead>
              <tr style={{ background:'var(--gray-50)' }}>
                <th style={{ padding:'8px 12px', textAlign:'left', color:'var(--gray-500)', fontWeight:700, fontSize:11, letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid var(--gray-200)' }}>Method</th>
                <th style={{ padding:'8px 12px', textAlign:'left', color:'var(--gray-500)', fontWeight:700, fontSize:11, letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid var(--gray-200)' }}>Path</th>
                <th style={{ padding:'8px 12px', textAlign:'left', color:'var(--gray-500)', fontWeight:700, fontSize:11, letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid var(--gray-200)' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r, i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--gray-100)' }}>
                  <td style={{ padding:'8px 12px' }}><Badge color={METHOD_COLOR[r.method]||'gray'}>{r.method}</Badge></td>
                  <td style={{ padding:'8px 12px', fontFamily:'var(--mono)', fontSize:12 }}>/api{r.path}</td>
                  <td style={{ padding:'8px 12px', color:'var(--gray-600)' }}>{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
