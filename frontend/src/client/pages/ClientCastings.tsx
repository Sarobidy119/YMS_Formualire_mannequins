import { useEffect, useState } from 'react'
import { listCastings } from '../../shared/services/operationsService'

export function ClientCastings() {
  const [castings, setCastings] = useState<any[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const data = await listCastings()
        setCastings(data)
      } catch {
        setCastings([])
      }
    })()
}, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Castings</h1>
      <p className="mt-1 text-sm text-gray-500">Les opportunités disponibles.</p>
      <div className="mt-5 space-y-3">
        {castings.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">Aucun casting disponible.</p>
          </div>
        )}
        {castings.map((c) => (
          <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-500">{c.client ?? 'YMS'}</div>
              </div>
              <div className="text-sm text-gray-500">{c.event_date ? new Date(c.event_date).toLocaleDateString() : 'Date à confirmer'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
