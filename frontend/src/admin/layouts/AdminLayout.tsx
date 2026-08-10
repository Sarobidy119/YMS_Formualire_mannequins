import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Activity, LogOut, ClipboardList, Menu, X } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const renderNavItems = (onNavigate: (() => void) | undefined) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-yms-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-yms-50 hover:text-yms-700'
            }`
          }
        >
          <Icon size={19} />
          <span>{label}</span>
          {to === '/admin/applications' && pendingApplications > 0 && (
            <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              {pendingApplications > 99 ? '99+' : pendingApplications}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Bouton menu flottant — mobile uniquement, compact, en haut à gauche */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
          className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md backdrop-blur transition hover:bg-yms-50 active:scale-95 mt-safe md:hidden"
        >
          <Menu size={19} />
        </button>
      )}

      {/* Sidebar fixe — visible en permanence sur grand écran, pas de toggle */}
      <aside className="hidden md:flex md:w-72 md:shrink-0 md:flex-col md:border-r md:border-gray-100 md:bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-yms-50 to-white px-4 py-4">
          <img src="/logo.jpg" alt="YMS" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
          <div>
            <span className="block text-base font-extrabold tracking-tight text-yms-700">YMS Admin</span>
            <span className="block text-xs text-gray-400">Espace de gestion</span>
          </div>
        </div>
        {renderNavItems(undefined)}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Drawer mobile (overlay) */}
      <aside
        className={`drawer-panel fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-yms-50 to-white px-4 py-4 pt-safe">
          <div className="flex flex-1 items-center gap-3">
            <img src="/logo.jpg" alt="YMS" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <div>
              <span className="block text-base font-extrabold tracking-tight text-yms-700">YMS Admin</span>
              <span className="block text-xs text-gray-400">Espace de gestion</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
        {renderNavItems(() => setSidebarOpen(false))}
        <div className="border-t border-gray-100 p-3 pb-safe">
          <button
            onClick={() => { setSidebarOpen(false); handleLogout() }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      <div className="flex-1">
        <main className="mx-auto w-full max-w-7xl p-4 pb-safe pt-16 md:p-8 md:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}