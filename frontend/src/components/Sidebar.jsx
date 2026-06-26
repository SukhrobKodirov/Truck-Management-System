import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',         icon: '📊', label: 'Dashboard' },
  { to: '/loads',    icon: '📦', label: 'Loads' },
  { to: '/trucks',   icon: '🚛', label: 'Trucks' },
  { to: '/tracking', icon: '📍', label: 'Live Tracking' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">🚛 TruckMS</h1>
        <p className="text-xs text-gray-400 mt-0.5">Fleet Management</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        v1.0.0
      </div>
    </aside>
  )
}
