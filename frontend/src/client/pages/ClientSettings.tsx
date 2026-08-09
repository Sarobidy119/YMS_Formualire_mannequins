import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../shared/services/authService'
import { Link } from 'react-router-dom'

export function ClientSettings() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    void (async () => {
      try {
        const p = await getCurrentProfile()
        setProfile(p)
      } catch {
        setProfile(null)
      }
    })()
}, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
      <p className="mt-1 text-sm text-gray-500">Gérez votre espace personnel.</p>
      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Email</p>
        <p className="mt-1 font-medium text-gray-900">{profile?.email ?? '—'}</p>
        <div className="mt-5">
          <Link to="/client/profile" className="inline-flex items-center justify-center rounded-xl bg-yms-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-yms-700 active:scale-95">Voir mon profil</Link>
        </div>
      </div>
    </div>
  )
}
