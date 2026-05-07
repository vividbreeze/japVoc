import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/learn', label: 'Lernen', icon: '📚' },
  { to: '/vocabulary', label: 'Vokabeln', icon: '📖' },
  { to: '/collections', label: 'Sammlungen', icon: '🗂️' },
  { to: '/statistics', label: 'Statistiken', icon: '📊' },
  { to: '/settings', label: 'Einstellungen', icon: '⚙️' },
];

export default function Navigation() {
  return (
    <>
      {/* Sidebar – desktop */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 py-8 px-4 gap-1 fixed left-0 top-0 z-30">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-indigo-700 font-japanese">日本語</h1>
          <p className="text-xs text-gray-400">Vokabeltrainer N5</p>
        </div>
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
      </nav>
    </>
  );
}
