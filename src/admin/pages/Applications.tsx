import { useEffect, useState } from 'react'
import { Check, Eye, X } from 'lucide-react'
import { getApplicationPhotoUrls, listApplications, reviewApplication, type ModelApplication } from '../../shared/services/applicationsService'
import { useToast } from '../../shared/components/Toast'

type ApplicationValue = string | boolean | string[] | null | undefined

const FIELD_LABELS: Record<string, string> = {
  first_name: 'Prénom', last_name: 'Nom', birth_date: 'Date de naissance', gender: 'Sexe',
  city: 'Ville', district: 'Quartier', phone: 'Téléphone', whatsapp: 'WhatsApp', email: 'E-mail',
  emergency_contact_phone: "Contact d'urgence",
  height_cm: 'Taille (cm)', weight_kg: 'Poids (kg)', shoe_size: 'Pointure', clothing_size: 'Taille vêtement',
  chest_cm: 'Tour de poitrine (cm)', waist_cm: 'Tour de taille (cm)', hips_cm: 'Tour de hanches (cm)',
  hair_color: 'Couleur des cheveux', eye_color: 'Couleur des yeux', distinguishing_features: 'Particularités physiques',
  level_yms: "Niveau d'expérience", experience_codes: "Types d'expériences", experience_details: "Détails d'expérience",
  skill_codes: 'Compétences', available_days: 'Jours disponibles', available_hours: 'Horaires disponibles',
  can_travel: 'Possibilité de déplacement', travel_zone: 'Zone de déplacement',
  accepted_rules: 'Règlement YMS accepté', image_usage_consent: "Utilisation de l'image autorisée",
  data_processing_consent: 'Traitement des données accepté', accuracy_confirmation: 'Informations confirmées exactes',
  parent_name: 'Nom du parent/tuteur', parent_contact: 'Contact du parent/tuteur', parent_consent: 'Autorisation parentale',
}

const FIELD_ORDER = Object.keys(FIELD_LABELS)

const VALUE_LABELS: Record<string, string> = {
  femme: 'Femme', homme: 'Homme', debutant: 'Débutant', intermediaire: 'Intermédiaire', experimente: 'Expérimenté',
  defile: 'Défilé', shooting: 'Shooting photo', publicite: 'Publicité', clip_video: 'Clip vidéo', cinema: 'Cinéma', theatre: 'Théâtre', evenementiel: 'Événementiel', autre: 'Autre',
  runway: 'Runway / Défilé', pose_photo: 'Pose photo', acting: 'Acting', dance: 'Dance', presentation_mc: 'Présentation / MC', expression_corporelle: 'Expression corporelle', prise_de_parole: 'Prise de parole', makeup: 'Makeup',
  Lun: 'Lundi', Mar: 'Mardi', Mer: 'Mercredi', Jeu: 'Jeudi', Ven: 'Vendredi', Sam: 'Samedi', Dim: 'Dimanche',
}

function hasAnswer(value: ApplicationValue) {
  return value !== null && value !== undefined && value !== '' && value !== false && (!Array.isArray(value) || value.length > 0)
}

function displayValue(value: ApplicationValue) {
  if (Array.isArray(value)) return value.map((item) => VALUE_LABELS[item] ?? item).join(', ')
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return VALUE_LABELS[String(value)] ?? String(value)
}

export function Applications() {
  const [items, setItems] = useState<ModelApplication[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<ModelApplication | null>(null)
  const [photoUrls, setPhotoUrls] = useState<{ path: string; signedUrl: string | null }[]>([])
  const { showToast } = useToast()

  const load = () => listApplications().then(setItems).catch(() => showToast('error', 'Impossible de charger les candidatures.'))
  useEffect(() => { load() }, [])

  async function review(id: string, decision: 'approve' | 'reject') {
    setBusy(id)
    try {
      const result = await reviewApplication(id, decision) as { invitationSent?: boolean } | undefined
      showToast('success', decision === 'approve' ? 'Candidature validée : fiche mannequin créée.' : 'Candidature refusée.')
      if (decision === 'approve' && result?.invitationSent) {
        showToast('success', 'Email d’invitation envoyé au candidat.')
      }
      load()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Action impossible.')
    } finally {
      setBusy(null)
    }
  }

  async function openApplication(application: ModelApplication) {
    setSelected(application)
    setPhotoUrls([])
    try {
      setPhotoUrls(await getApplicationPhotoUrls(application.id))
    } catch {
      showToast('error', 'Impossible de charger les photos.')
    }
  }

  const answers = selected
    ? FIELD_ORDER
      .map((key) => ({ key, value: selected.data[key] as ApplicationValue }))
      .filter(({ value }) => hasAnswer(value))
    : []

  return <>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidatures</h1>
        <p className="text-sm text-gray-500">Consultez les réponses avant de valider ou refuser.</p>
      </div>
      <div className="space-y-3">
        {items.map((application) => <article key={application.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{application.full_name}</p><p className="text-sm text-gray-500">{application.email} · {application.application_number}</p></div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{application.status.replace('_', ' ')}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => openApplication(application)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-700"><Eye size={16} /> Voir le formulaire</button>
            {application.status === 'en_attente' && <>
              <button disabled={busy === application.id} onClick={() => review(application.id, 'approve')} className="flex items-center gap-1 rounded-lg bg-yms-600 px-3 py-2 text-sm text-white"><Check size={16} /> Valider</button>
              <button disabled={busy === application.id} onClick={() => review(application.id, 'reject')} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-red-600"><X size={16} /> Refuser</button>
            </>}
          </div>
        </article>)}
        {!items.length && <p className="rounded-xl bg-white p-6 text-sm text-gray-500">Aucune candidature pour le moment.</p>}
      </div>
    </div>

    {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-bold">Formulaire de {selected.full_name}</h2><p className="text-sm text-gray-500">{selected.application_number}</p></div>
          <button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-1 text-sm">Fermer</button>
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {answers.map(({ key, value }) => <div key={key} className="rounded-lg bg-gray-50 p-3">
            <dt className="text-xs font-medium uppercase text-gray-500">{FIELD_LABELS[key]}</dt>
            <dd className="mt-1 break-words text-sm text-gray-800">{displayValue(value)}</dd>
          </div>)}
        </dl>
        <div className="mt-6">
          <h3 className="font-semibold">Photos envoyées</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoUrls.map((photo) => <a key={photo.path} href={photo.signedUrl ?? '#'} target="_blank" rel="noreferrer"><img src={photo.signedUrl ?? ''} alt="Photo candidature" className="aspect-square w-full rounded-lg object-cover" /></a>)}
          </div>
          {!photoUrls.length && <p className="mt-2 text-sm text-gray-500">Aucune photo envoyée.</p>}
        </div>
      </div>
    </div>}
  </>
}
