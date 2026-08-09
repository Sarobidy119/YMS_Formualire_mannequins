import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../../shared/services/authService'
import { getMyActivities } from '../../shared/services/operationsService'

export function ClientActivities() {
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile?.id) return setActivities([])
        const data = await getMyActivities(profile.id)
        setActivities(data)
      } catch {
        setActivities([])
      }
    })()
}, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Activités</h1>
      <p className="mt-1 text-sm text-gray-500">Vos participations enregistrées.</p>
      <div className="mt-5 space-y-3">
        {activities.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">Aucune activité pour le moment.</p>
          </div>
        )}
        {activities.map((a) => (
          <div key={a.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="font-semibold text-gray-900">{a.activity_type}</div>
            <div className="mt-1 text-sm text-gray-500">{a.description || 'Sans description'}</div>
            <div className="mt-2 text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
