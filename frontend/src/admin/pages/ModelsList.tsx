import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Trash2, FileDown, Filter, Users } from 'lucide-react'
import { searchModels, exportModels, deleteModel, type ModelFilters } from '../../shared/services/modelsService'
import type { Model } from '../../shared/types/database.types'
import { StatusBadge } from '../../shared/components/Badge'
import { TableSkeleton } from '../../shared/components/Skeleton'
import { EmptyState } from '../../shared/components/EmptyState'
import { calculateAge } from '../../shared/utils/formatters'
import { useToast } from '../../shared/components/Toast'

export function ModelsList() {
  const [models, setModels] = useState<Model[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ModelFilters>({ page: 1, pageSize: 20 })
  const { showToast } = useToast()

  async function load() {
    setLoading(true)
    try {
      const { data, count } = await searchModels(filters)
      setModels(data)
      setCount(count)
    } catch (err) {
      showToast('error', 'Erreur lors du chargement des mannequins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer définitivement ce mannequin ?')) return
    try {
      await deleteModel(id)
      showToast('success', 'Mannequin supprimé')
      load()
    } catch {
      showToast('error', 'Erreur lors de la suppression')
    }
  }

  async function handleExport() {
    try {
      const rows = await exportModels(filters)
      const headers = ['ID YMS', 'Prenom', 'Nom', 'Sexe', 'Date de naissance', 'Ville', 'Telephone', 'Email', 'Niveau', 'Statut']
      const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const csv = [headers, ...rows.map((row) => [row.yms_id, row.first_name, row.last_name, row.gender, row.birth_date, row.city, row.phone, row.email, row.level_yms, row.status])]
        .map((row) => row.map(escapeCsv).join(';'))
        .join('\n')
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'mannequins-yms.csv'
      link.click()
      URL.revokeObjectURL(url)
      showToast('success', `${rows.length} mannequin(s) exporte(s)`)
    } catch {
      showToast('error', "Erreur lors de l'export de la liste")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mannequins</h1>
          <p className="text-sm text-gray-500">{count} profil{count > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleExport} disabled={loading} className="flex items-center gap-2 rounded-lg bg-yms-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yms-700 disabled:opacity-50">
          <FileDown size={16} /> Exporter la liste filtrée
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Rechercher par nom, prénom ou ID YMS..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
              onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value, page: 1 }))}
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter size={16} />
            Filtres avancés
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              onChange={(e) => setFilters((f) => ({ ...f, gender: (e.target.value || undefined) as any, page: 1 }))}
            >
              <option value="">Sexe (tous)</option>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value || undefined, page: 1 }))}
            >
              <option value="">Niveau (tous)</option>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="experimente">Expérimenté</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            >
              <option value="">Statut (tous)</option>
              <option value="actif">Actif</option>
              <option value="disponible">Disponible</option>
              <option value="indisponible">Indisponible</option>
              <option value="suspendu">Suspendu</option>
            </select>
            <input
              placeholder="Ville"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined, page: 1 }))}
            />
          </div>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : models.length === 0 ? (
        <EmptyState icon={Users} title="Aucun mannequin trouvé" description="Essaie d'ajuster tes filtres de recherche" />
      ) : (
        <>
          {/* Tableau desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID YMS</th>
                  <th className="px-4 py-3">Nom complet</th>
                  <th className="px-4 py-3">Sexe</th>
                  <th className="px-4 py-3">Âge</th>
                  <th className="px-4 py-3">Ville</th>
                  <th className="px-4 py-3">Niveau</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.yms_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{m.gender}</td>
                    <td className="px-4 py-3 text-gray-600">{calculateAge(m.birth_date)} ans</td>
                    <td className="px-4 py-3 text-gray-600">{m.city}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{m.level_yms ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/models/${m.id}`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="space-y-3 md:hidden">
            {models.map((m) => (
              <div key={m.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-gray-500">{m.yms_id}</p>
                    <p className="font-semibold text-gray-900">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {calculateAge(m.birth_date)} ans · {m.city}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <Link
                    to={`/admin/models/${m.id}`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-sm font-medium text-gray-700"
                  >
                    <Eye size={14} /> Voir
                  </Link>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-sm font-medium text-red-600"
                  >
                    <Trash2 size={14} /> Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
