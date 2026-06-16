import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Vocabulary from './pages/Vocabulary';
import Collections from './pages/Collections';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import { useSettingsStore } from './store/useSettingsStore';
import { checkAuth, setToken } from './api/client';

type Phase = 'checking' | 'login' | 'app';

export default function App() {
  const { load } = useSettingsStore();
  const [phase, setPhase] = useState<Phase>('checking');
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    checkAuth()
      .then(({ authRequired: req }) => {
        setAuthRequired(req);
        setPhase(req ? 'login' : 'app');
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthRequired(true);
          setPhase('login');
        } else {
          setPhase('app');
        }
      });
  }, []);

  useEffect(() => {
    if (phase === 'app') load();
  }, [phase, load]);

  const handleLogout = () => {
    setToken(null);
    setPhase('login');
  };

  if (phase === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'login') {
    return <Login onSuccess={() => setPhase('app')} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation onLogout={authRequired ? handleLogout : undefined} />

        <main className="md:ml-56 pb-20 md:pb-0">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
