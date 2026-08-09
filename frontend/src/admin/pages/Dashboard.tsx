import { useEffect, useState } from 'react'
import { Users, UserCheck, UserX, CheckCircle } from 'lucide-react'
import { getDashboardStats } from '../../shared/services/modelsService'
import { Skeleton } from '../../shared/components/Skeleton'

interface Stats {
  total: number
  femmes: number
  hommes: number
  actifs: number
  disponibles: number
  indisponibles: number
  suspendus: number
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function SimpleBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value} ({pct}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble des mannequins YMS</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total mannequins" value={stats.total} icon={Users} color="bg-yms-600" />
        <StatCard label="Femmes" value={stats.femmes} icon={Users} color="bg-pink-500" />
        <StatCard label="Hommes" value={stats.hommes} icon={Users} color="bg-blue-500" />
        <StatCard label="Actifs" value={stats.actifs} icon={UserCheck} color="bg-green-600" />
        <StatCard label="Disponibles" value={stats.disponibles} icon={CheckCircle} color="bg-emerald-500" />
        <StatCard label="Indisponibles" value={stats.indisponibles} icon={UserX} color="bg-amber-500" />
        <StatCard label="Suspendus" value={stats.suspendus} icon={UserX} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Répartition Homme / Femme</h2>
          <div className="space-y-4">
            <SimpleBar label="Femmes" value={stats.femmes} total={stats.total} color="bg-pink-500" />
            <SimpleBar label="Hommes" value={stats.hommes} total={stats.total} color="bg-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Statuts</h2>
          <div className="space-y-4">
            <SimpleBar label="Actifs" value={stats.actifs} total={stats.total} color="bg-green-600" />
            <SimpleBar label="Disponibles" value={stats.disponibles} total={stats.total} color="bg-emerald-500" />
            <SimpleBar label="Indisponibles" value={stats.indisponibles} total={stats.total} color="bg-amber-500" />
            <SimpleBar label="Suspendus" value={stats.suspendus} total={stats.total} color="bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
