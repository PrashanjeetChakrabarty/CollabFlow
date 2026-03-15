import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import ProjectGallery from './pages/Projects/ProjectGallery';
import GlobalDashboard from './pages/Dashboard/GlobalDashboard';
import SettingsProfile from './pages/Settings/SettingsProfile';
import WorkspaceContainer from './pages/Workspace/WorkspaceContainer';
import { LoginScreen } from './pages/Auth/LoginScreen';
import { useAppStore } from './store/useAppStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Loader2 } from 'lucide-react';

function App() {
  const { currentUser, isAuthLoading, setCurrentUser, setIsAuthLoading } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentUser, setIsAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-electric-violet animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {currentUser ? (
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<GlobalDashboard />} />
            <Route path="projects" element={<ProjectGallery />} />
            <Route path="workspace/:projectId" element={<WorkspaceContainer />} />
            <Route path="settings" element={<SettingsProfile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          <Route path="*" element={<LoginScreen />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}

export default App;
