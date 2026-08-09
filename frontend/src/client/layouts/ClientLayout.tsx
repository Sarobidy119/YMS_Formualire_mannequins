import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Calendar, Activity, Settings, LogOut, Menu, X } from 'lucide-react'
import { signOut } from '../../shared/services/authService'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/castings', label: 'Castings', icon: Calendar },
  { to: '/client/activities', label: 'Activités', icon: Activity },
  { to: '/client/settings', label: 'Paramètres', icon: Settings },
]

export function ClientLayout() {
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

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

      {/* Desktop aside */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <img src="/logo.jpg" alt="YMS" className="mr-3 h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-bold text-yms-700">Espace Modèle</span>
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
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-yms-50">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile aside (overlay) */}
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
              <span className="block text-base font-extrabold tracking-tight text-yms-700">Espace Modèle</span>
              <span className="block text-xs text-gray-400">Mon espace personnel</span>
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
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-yms-600 text-white shadow-sm' : 'text-gray-600 hover:bg-yms-50 hover:text-yms-700'
                }`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3 pb-safe">
          <button
            onClick={() => { setSidebarOpen(false); handleLogout() }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Backdrop when sidebar open */}
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