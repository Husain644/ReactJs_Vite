import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast.jsx';

import Layout from './components/layout/Layout.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import NodesPage from './pages/Nodes/NodesPage.jsx';
import ScreensPage from './pages/Screens/ScreensPage.jsx';
import SectionsPage from './pages/Sections/SectionsPage.jsx';
import QuizzesPage from './pages/Quizzes/QuizzesPage.jsx';
import ModelsPage from './pages/Models/ModelsPage.jsx';
import UploadPage from './pages/Upload/UploadPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';

import './styles/global.css';

export default function ThreeHome() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="nodes"    element={<NodesPage />} />
          <Route path="screens"  element={<ScreensPage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="quizzes"  element={<QuizzesPage />} />
          <Route path="models"   element={<ModelsPage />} />
          <Route path="upload"   element={<UploadPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
