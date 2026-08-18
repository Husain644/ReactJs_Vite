import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from "./pages/Dashboard.jsx";
import ContentEditor from "./pages/ContentEditor.jsx";
import Viewer from "./pages/Viewer.jsx";
import Preview from "./pages/Preview.jsx";
import './styles/global.css';

// Define nested routes for this module
const NESTED_ROUTES = [
  { path: '/', element: Dashboard },
  { path: '/new', element: ContentEditor },
  { path: '/edit/:id', element: ContentEditor },
  { path: '/view/:id', element: Viewer },
  { path: '/preview/:id', element: Preview },
];

const THEME_STORAGE_KEY = 'three-cms-theme';

export default function ThreeHome() {
  // Default is light; only switches to dark if the user explicitly picked
  // it before (persisted in localStorage) — never follows OS preference,
  // so it can't silently start dark for someone who never chose that.
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private browsing, etc.) — theme just
      // won't persist across reloads, not worth failing over.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`three-app ${theme === 'dark' ? 'three-app--dark' : ''}`}>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <Routes>
        {NESTED_ROUTES.map((route, index) => (
          <Route 
            key={index}
            path={route.path} 
            element={<route.element />} 
          />
        ))}
        {/* Any unmatched sub-path under /three3D falls back to the dashboard
            instead of rendering blank */}
        <Route path="*" element={<Navigate to="/three3D" replace />} />
      </Routes>
    </div>
  );
}

// Export for route configuration
ThreeHome.getNestedRoutes = () => {
  return NESTED_ROUTES.reduce((acc, route) => {
    const key = route.path.replace('/', '').replace('/:id', '').toUpperCase() || 'DASHBOARD';
    acc[key] = route.path;
    return acc;
  }, {});
};