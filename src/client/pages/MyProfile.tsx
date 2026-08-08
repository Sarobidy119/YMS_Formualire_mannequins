import { useEffect, useState } from 'react'
import { getModelFullProfile } from '../../shared/services/modelsService'
import type { ModelFullProfile } from '../../shared/types/database.types'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../shared/components/Badge'
import { Skeleton } from '../../shared/components/Skeleton'
import { calculateAge } from '../../shared/utils/formatters'
import { signOut } from '../../shared/services/authService'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'

// Vue mannequin : n'affiche JAMAIS admin_notes (includeAdminNotes = false).
// Même en cas d'erreur de code ici, la RLS empêcherait de toute façon la
// lecture de la table admin_notes par un profil non-admin.
export function MyProfile() {
  const [model, setModel] = useState<ModelFullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return
      const { data: modelRow } = await supabase
        .from('models')
        .select('id')
        .eq('profile_id', sessionData.session.user.id)
        .maybeSingle()

      if (!modelRow) {
        setLoading(false)
        return
      }
      const profile = await getModelFullProfile(modelRow.id, false)
      setModel(profile)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  if (loading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>

  if (!model) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-600">Tu n'as pas encore créé ton profil mannequin.</p>
        <Link to="/client/onboarding" className="rounded-lg bg-yms-600 px-6 py-3 text-sm font-medium text-white">
          Créer mon profil
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500">
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="font-mono text-sm text-gray-500">{model.yms_id}</p>
        <h2 className="text-2xl font-bold text-gray-900">{model.first_name} {model.last_name}</h2>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={model.status} />
          <span className="text-sm text-gray-500">{calculateAge(model.birth_date)} ans</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Taille</p><p className="font-medium">{model.measurements?.height_cm ?? '—'} cm</p></div>
          <div><p className="text-gray-500">Ville</p><p className="font-medium">{model.city}</p></div>
          <div><p className="text-gray-500">Niveau</p><p className="font-medium capitalize">{model.level_yms ?? '—'}</p></div>
          <div><p className="text-gray-500">Compétences</p><p className="font-medium">{model.skills.length}</p></div>
        </div>

        <p className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Ton statut est mis à jour par l'équipe YMS. Certaines informations (statut, catégorie,
          niveau) ne sont modifiables que par un administrateur.
        </p>
      </div>
    </div>
  )
}
