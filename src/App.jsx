import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';

import axios from 'axios';

import LinksTable from './utils/linkTable';

import Home from './express_view/home';
import ThreeHome from './three/home.jsx';
import HomeChat from './real_Time/chat/home';
import VideoCall from './real_Time/chat/components/videocall';

axios.defaults.baseURL = 'https://www.techtt.site';

const AllLinks = [
  {
    name: 'Files Manager',
    path: '/three/html/view/*',
    component: Home,
  },
  {
    name: 'Chat',
    path: '/three/chat/*',
    component: HomeChat,
  },
  {
    name: 'Video Call',
    path: '/three/video-call',
    component: VideoCall,
  },
  {
    name: 'Three',
    path: '/three/*',
    component: ThreeHome,
  },
];

function App() {
  return (
    <Router>
      <Routes>
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
      </Routes>
    </Router>
  );
}

export default App;
