import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import axios from 'axios';

import LinksTable from './utils/linkTable';

import Home from './express_view/home';
import ThreeHome from './three/home.jsx';
import HomeChat from './real_Time/chat/home';
import VideoCall from './real_Time/chat/components/videocall';

axios.defaults.baseURL = 'https://www.techt.site';

const AllLinks = [
  {
    name: 'Files Manager',
    path: '/html/view/*',
    component: Home,
  },
  {
    name: 'Chat',
    path: '/chat/*',
    component: HomeChat,
  },
  {
    name: 'Video Call',
    path: '/video-call',
    component: VideoCall,
  },
  {
    name: 'Three',
    path: '/three3D/*',  // This matches the nested routes
    component: ThreeHome,
  },
];

function App() {
  return (
    <Router basename="/three">
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/all" replace />}
        />

        <Route
          path="/all"
          element={<LinksTable routes={AllLinks} />}
        />

        {AllLinks.map(item => {
          const Component = item.component;

          return (
            <Route
              key={item.path}
              path={item.path}
              element={<Component />}
            />
          );
        })}

        {/* Catch-all: anything that doesn't match falls back to /all
            instead of rendering a blank "not found" screen */}
        <Route path="*" element={<Navigate to="/all" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
