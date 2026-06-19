import { useLocation } from 'react-router-dom';
import './Navbar.css';

const TITLES = {
  '':         'Dashboard',
  'nodes':    'Nodes',
  'screens':  'Screens',
  'sections': 'Sections',
  'quizzes':  'Quizzes',
  'models':   '3D Models',
  'upload':   'Upload Manager',
  'settings': 'Settings',
};

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  // pathname is like /three/nodes or /three — extract the segment after /three/
  const segments = pathname.split('/').filter(Boolean); // ['three', 'nodes']
  const page = segments[1] || '';                       // 'nodes' | '' for dashboard
  const title = TITLES[page] ?? 'EduApp CMS';

  return (
    <header className="navbar">
      <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="menu">
        <span /><span /><span />
      </button>

      <div className="navbar-title">
        <h1>{title}</h1>
      </div>

      <div className="navbar-actions">
        <a
          href="https://www.techtt.site/html/getFile/docs/threeApp_backend/threeApiTest.html"
          target="_blank"
          rel="noreferrer"
          className="navbar-api-badge"
        >
          API ↗
        </a>
        <div className="navbar-avatar">A</div>
      </div>
    </header>
  );
}
