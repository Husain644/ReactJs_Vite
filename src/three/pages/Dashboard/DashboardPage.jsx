import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { nodeApi } from '../../api/services.js';
import { StatCard, Card, Badge, Skeleton } from '../../components/common/Common.jsx';
import './Dashboard.css';

const QUICK = [
  { label: 'Add Node',    to: '/nodes',    icon: '🗂️', color: '#2563eb' },
  { label: 'Add Quiz',    to: '/quizzes',  icon: '📝', color: '#16a34a' },
  { label: 'Upload File', to: '/upload',   icon: '📤', color: '#d97706' },
  { label: 'Add 3D Model',to: '/models',   icon: '🧊', color: '#7c3aed' },
];

export default function DashboardPage() {
  const [nodes,   setNodes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nodeApi.getRoots()
      .then(r => setNodes(r?.data?.nodes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Root Nodes"   value={loading ? '—' : nodes.length} icon="🗂️" color="#2563eb" />
        <StatCard label="Total Screens" value="—" icon="🖥️" color="#16a34a" sub="Connect screen API" />
        <StatCard label="Sections"     value="—" icon="📦" color="#d97706" />
        <StatCard label="3D Models"    value="—" icon="🧊" color="#7c3aed" />
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="quick-actions">
            {QUICK.map(q => (
              <Link key={q.to} to={q.to} className="quick-item">
                <div className="quick-icon" style={{ background: q.color + '18', color: q.color }}>{q.icon}</div>
                <span>{q.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Root Nodes */}
        <Card title="Root Nodes" action={
          <Link to="/three/nodes" style={{ fontSize: 12, color: 'var(--blue)' }}>View all →</Link>
        }>
          {loading
            ? [1,2,3].map(i => <Skeleton key={i} h={40} radius={6} style={{ marginBottom: 8 }} />)
            : nodes.length === 0
            ? <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No nodes yet. <Link to="/three/nodes" style={{color:'var(--blue)'}}>Create one →</Link></p>
            : nodes.map(n => (
              <div key={n._id} className="node-row">
                <span style={{ fontSize: 18 }}>{n.icon || '📁'}</span>
                <div className="node-row-info">
                  <div className="node-row-title">{n.title}</div>
                  <div className="node-row-slug">{n.slug}</div>
                </div>
                <Badge color={n.type === 'screen' ? 'blue' : 'gray'}>{n.type}</Badge>
              </div>
            ))
          }
        </Card>

        {/* CMS Architecture */}
        <Card title="CMS Architecture" className="arch-card">
          <div className="arch-tree">
            {['🗂️ Node (folder/screen)', '  └── 🖥️ Screen (layout config)', '       └── 📦 Section[] (content)', '            ├── Heading, Text, Image', '            ├── Cards, Table, Stepper', '            ├── Formula, Tip, Warning', '            ├── 🧊 3D Model (lazy)', '            └── 📝 Quiz (lazy)'].map((line, i) => (
              <div key={i} className="arch-line">{line}</div>
            ))}
          </div>
        </Card>

        {/* API Status */}
        <Card title="API Status">
          <ApiStatus />
        </Card>
      </div>
    </div>
  );
}

function ApiStatus() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    nodeApi.getRoots()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  const color = status === 'online' ? 'var(--green)' : status === 'offline' ? 'var(--red)' : 'var(--amber)';
  const label = status === 'online' ? '✓ Online' : status === 'offline' ? '✕ Offline' : '⋯ Checking';

  return (
    <div className="api-status">
      <div className="api-status-dot" style={{ background: color }} />
      <div>
        <div style={{ fontWeight: 600, color }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--mono)' }}>
          techtt.site/three/api
        </div>
      </div>
    </div>
  );
}
