import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Vocabulary from './pages/Vocabulary';
import Collections from './pages/Collections';
import Statistics from './pages/Statistics';
import { useSettingsStore } from './store/useSettingsStore';

export default function App() {
  const { load } = useSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Main content */}
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
