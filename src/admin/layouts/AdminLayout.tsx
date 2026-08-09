import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Activity, LogOut, ClipboardList } from 'lucide-react'
import { signOut } from '../../shared/services/authService'
import { listApplications } from '../../shared/services/applicationsService'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/models', label: 'Mannequins', icon: Users },
  { to: '/admin/applications', label: 'Candidatures', icon: ClipboardList },
  { to: '/admin/castings', label: 'Castings', icon: Calendar },
  { to: '/admin/activities', label: 'Activités', icon: Activity },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const [pendingApplications, setPendingApplications] = useState(0)

  useEffect(() => {
    const loadPendingApplications = async () => {
      try {
        const apps = await listApplications()
        const count = apps.filter((app) => app.status === 'en_attente').length
        setPendingApplications(count)
      } catch {
        setPendingApplications(0)
      }
    }
    void loadPendingApplications()
    const interval = window.setInterval(loadPendingApplications, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <img src="/logo.jpg" alt="YMS" className="mr-3 h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-bold text-yms-700">YMS Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-yms-50 text-yms-700' : 'text-gray-600 hover:bg-yms-50'}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === '/admin/applications' && pendingApplications > 0 && (
                <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingApplications > 99 ? '99+' : pendingApplications}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-yms-50">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>
      <div className="flex-1"><main className="p-4 md:p-8"><Outlet /></main></div>
    </div>
  )
}
