import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../shared/services/authService'
import { listCastings } from '../../shared/services/operationsService'
import { getModelFullProfile } from '../../shared/services/modelsService'

export function ClientDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [castingsCount, setCastingsCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const p = await getCurrentProfile()
        setProfile(p)
        if (p?.id && 'yms_id' in p) {
          await getModelFullProfile(p.id)
        }
      } catch {
        // ignore
      }
      try {
        const castings = await listCastings()
        setCastingsCount(castings.length)
      } catch {
        setCastingsCount(0)
      }
    }
void load()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Bienvenue{profile ? `, ${profile.full_name ?? ''}` : ''}.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Castings</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{castingsCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Activités</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-1">
          <p className="text-sm text-gray-500">Profil</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{profile ? 'Complété' : 'Non renseigné'}</p>
        </div>
      </div>
    </div>
  )
}
