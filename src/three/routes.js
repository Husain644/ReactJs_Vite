// modules/three/three.routes.js
import Dashboard from './pages/Dashboard';
import ContentEditor from './pages/ContentEditor';
import Viewer from './pages/Viewer';

export const THREE_ROUTES = {
  DASHBOARD: {
    path: '/three3D',
    element: Dashboard,
    exact: true,
  },
  NEW: {
    path: '/three3D/new',
    element: ContentEditor,
    exact: true,
  },
  EDIT: {
    path: '/three3D/edit/:id',
    element: ContentEditor,
    exact: true,
  },
  VIEW: {
    path: '/three3D/view/:id',
    element: Viewer,
    exact: true,
  },
};

// Helper for navigation within Three module
export const getThreePath = (route, params = {}) => {
  const routes = {
    dashboard: '/three3D',
    new: '/three3D/new',
    edit: '/three3D/edit/:id',
    view: '/three3D/view/:id',
  };
  
  let path = routes[route];
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, params[key]);
  });
  return path;
};