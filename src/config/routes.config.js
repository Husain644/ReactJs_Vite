// config/routes.config.js

export const ROUTES = {
  // Main app routes
  APP: {
    HOME: '/',
    ALL: '/all',
  },
  
  // Feature modules
  THREE: {
    ROOT: '/three3D',
    DASHBOARD: '/three3D',
    NEW: '/three3D/new',
    EDIT: '/three3D/edit/:id',
    VIEW: '/three3D/view/:id',
  },
  
  CHAT: {
    ROOT: '/chat',
    HOME: '/chat',
    ROOM: '/chat/room/:id',
  },
  
  FILES: {
    ROOT: '/html/view',
    HOME: '/html/view',
    FOLDER: '/html/view/folder/:id',
    FILE: '/html/view/file/:id',
  },
  
  VIDEO: {
    ROOT: '/video-call',
    CALL: '/video-call/:roomId',
  },
};

// Helper to generate paths
export const buildPath = (route, params = {}) => {
  let path = route;
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, params[key]);
  });
  return path;
};