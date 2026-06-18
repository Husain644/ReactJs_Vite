import React from 'react';
import { Routes, Route } from 'react-router-dom';

import View_file from './components/pages/view_file.jsx';
import View_sub_file from './components/pages/view_sub_file.jsx';
import Edit_file from './components/pages/edit_file.jsx';

import './express.css';

const routes = [
  {
    path: 'category/:category',
    component: View_sub_file,
  },
  {
    path: 'edit',
    component: Edit_file,
  },
  {
    path: '*',
    component: View_file,
  },
];

function Home() {
  return (
    <Routes>
      {routes.map((item, index) => {
        const Component = item.component;

        return (
          <Route
            key={index}
            path={item.path}
            element={<Component />}
          />
        );
      })}
    </Routes>
  );
}

export default Home;
