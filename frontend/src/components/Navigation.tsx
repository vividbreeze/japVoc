import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import SettingsOverlay from './SettingsOverlay';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/learn', label: 'Lernen', icon: '📚' },
  { to: '/vocabulary', label: 'Vokabeln', icon: '📖' },
  { to: '/collections', label: 'Sammlungen', icon: '🗂️' },
  { to: '/statistics', label: 'Statistiken', icon: '📊' },
];

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function Navigation() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Sidebar – desktop */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 py-8 px-4 fixed left-0 top-0 z-30">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-indigo-700 font-japanese">日本語</h1>
          <p className="text-xs text-gray-400">Vokabeltrainer N5</p>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Gear button pinned to bottom */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <GearIcon />
          <span>Einstellungen</span>
        </button>
      </aside>

      {/* Bottom bar – mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span className="hidden sm:block">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowSettings(true)}
          className="flex-1 flex flex-col items-center py-2 text-xs gap-0.5 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <span className="text-xl flex items-center justify-center h-7"><GearIcon /></span>
          <span className="hidden sm:block">Einstellungen</span>
        </button>
      </nav>

      <SettingsOverlay isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
