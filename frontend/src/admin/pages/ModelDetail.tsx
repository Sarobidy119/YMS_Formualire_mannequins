import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileDown, Pencil } from 'lucide-react'
import { getModelFullProfile } from '../../shared/services/modelsService'
import type { ModelFullProfile } from '../../shared/types/database.types'
import { StatusBadge } from '../../shared/components/Badge'
import { Skeleton } from '../../shared/components/Skeleton'
import { calculateAge } from '../../shared/utils/formatters'
import { exportModelProfilePDF } from '../../shared/services/pdfService'

export function ModelDetail() {
  const { id } = useParams<{ id: string }>()
  const [model, setModel] = useState<ModelFullProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // includeAdminNotes = true : cette page est dans /admin/*, réservée aux admins.
    // La RLS garantit de toute façon qu'un non-admin recevrait un tableau vide ici.
    getModelFullProfile(id, true)
      .then(setModel)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Skeleton className="h-96 w-full" />
  if (!model) return <p>Mannequin introuvable.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/models" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => exportModelProfilePDF(model)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FileDown size={16} /> Exporter PDF
          </button>
          <Link
            to={`/admin/models/${model.id}/edit`}
            className="flex items-center gap-2 rounded-lg bg-yms-600 px-4 py-2 text-sm font-medium text-white hover:bg-yms-700"
          >
            <Pencil size={16} /> Modifier
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="h-32 w-32 flex-shrink-0 rounded-2xl bg-gray-100" />
          <div className="flex-1">
            <p className="font-mono text-sm text-gray-500">{model.yms_id}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {model.first_name} {model.last_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>{calculateAge(model.birth_date)} ans</span>
              <span>·</span>
              <span className="capitalize">{model.gender}</span>
              <span>·</span>
              <span>{model.city}</span>
              <span>·</span>
              <StatusBadge status={model.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Mensurations</h2>
          {model.measurements ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">Taille</dt><dd className="font-medium">{model.measurements.height_cm} cm</dd></div>
              <div><dt className="text-gray-500">Pointure</dt><dd className="font-medium">{model.measurements.shoe_size ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Taille vêtement</dt><dd className="font-medium">{model.measurements.clothing_size ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Poids</dt><dd className="font-medium">{model.measurements.weight_kg ?? '—'}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">Non renseigné</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Compétences</h2>
          <div className="flex flex-wrap gap-2">
            {model.skills.map((s) => (
              <span key={s.id} className="rounded-full bg-yms-50 px-3 py-1 text-xs font-medium text-yms-700">
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Expérience</h2>
          <p className="mb-2 text-sm capitalize text-gray-600">Niveau : {model.level_yms}</p>
          <ul className="space-y-1 text-sm text-gray-600">
            {model.experiences.map((e) => (
              <li key={e.id}>• {e.label}{e.details ? ` — ${e.details}` : ''}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Disponibilité</h2>
          {model.availability && (
            <ul className="space-y-1 text-sm text-gray-600">
              {model.availability.available_runway && <li>• Défilé</li>}
              {model.availability.available_shooting && <li>• Shooting</li>}
              {model.availability.available_ad && <li>• Publicité</li>}
              {model.availability.available_event && <li>• Événementiel</li>}
              {model.availability.can_travel && <li>• Déplacement possible ({model.availability.travel_zone ?? 'zone non précisée'})</li>}
            </ul>
          )}
        </div>

        {/* ADMIN ONLY — jamais visible côté mannequin, protégé par RLS */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:col-span-2">
          <h2 className="mb-4 font-semibold text-amber-900">Notes internes (admin uniquement)</h2>
          {model.admin_notes && model.admin_notes.length > 0 ? (
            <ul className="space-y-2 text-sm text-amber-900">
              {model.admin_notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-white/60 p-3">
                  {n.note} {n.internal_rating && <span className="ml-2 font-medium">({n.internal_rating}/5)</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-amber-700">Aucune note interne</p>
          )}
        </div>
      </div>
    </div>
  )
}
