import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { EditRequestsPanel } from '../components/EditRequestsPanel'
import type { UserRole } from '../types/auth'

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/companies', label: 'Companies', icon: '🏭' },
  { to: '/masters', label: 'Master Data', icon: '🗂️', roles: ['super', 'admin'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['super', 'admin'] },
  { to: '/reports', label: 'Reports', icon: '📊', roles: ['super', 'admin'] },
  { to: '/audit-log', label: 'Audit Log', icon: '📜', roles: ['super', 'admin'] },
]

const roleStyles: Record<string, string> = {
  super: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  msme: 'bg-green-100 text-green-800 border-green-200',
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  if (!user) return null

  const visibleNav = navItems.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200">
          <h1 className="text-base font-bold text-slate-900">MSME Platform</h1>
          <p className="text-xs text-slate-500">TIDCO · Tamil Nadu</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase ${roleStyles[user.role] ?? ''}`}
            >
              {user.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        {(user.role === 'super' || user.role === 'admin') && (
          <div className="max-w-7xl mx-auto px-8 pt-6">
            <EditRequestsPanel />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
