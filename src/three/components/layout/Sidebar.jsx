import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const NAV = [
  { to: '/three',          icon: '⬛', label: 'Dashboard', end: true },
  { to: '/three/nodes',    icon: '🗂️', label: 'Nodes'     },
  { to: '/three/screens',  icon: '🖥️', label: 'Screens'   },
  { to: '/three/sections', icon: '📦', label: 'Sections'  },
  { to: '/three/quizzes',  icon: '📝', label: 'Quizzes'   },
  { to: '/three/models',   icon: '🧊', label: '3D Models' },
  { to: '/three/upload',   icon: '📤', label: 'Upload'    },
  { to: '/three/settings', icon: '⚙️', label: 'Settings'  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚙</div>
          <div>
            <div className="sidebar-logo-title">EduApp CMS</div>
            <div className="sidebar-logo-sub">Mechanical Engineering</div>
          </div>
        </div>

        <div className="sidebar-section-label">Content</div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-dot" />
          <span>API: techtt.site/three</span>
        </div>
      </aside>
    </>
  );
}
