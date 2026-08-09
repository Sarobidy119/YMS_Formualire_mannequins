import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepProgress } from '../components/StepProgress'
import { PhotoUploadField } from '../components/PhotoUploadField'
import { useToast } from '../../shared/components/Toast'
import { submitApplication } from '../../shared/services/applicationsService'
import { formatErrorMessage } from '../../shared/utils/errorMessages'
import { isMinor } from '../../shared/utils/formatters'
import type { PhotoType } from '../../shared/types/database.types'

const STEP_LABELS = [
  'Informations personnelles',
  'Profil mannequin',
  'Expérience',
  'Compétences',
  'Disponibilité',
  'Photos',
  'Autorisations',
  'Confirmation',
]

const EXPERIENCES = [
  ['defile', 'Défilé'], ['shooting', 'Shooting photo'], ['publicite', 'Publicité'],
  ['clip_video', 'Clip vidéo'], ['cinema', 'Cinéma'], ['theatre', 'Théâtre'],
  ['evenementiel', 'Événementiel'], ['autre', 'Autres'],
]

const SKILLS = [
  ['runway', 'Runway / Défilé'], ['pose_photo', 'Pose photo'], ['acting', 'Acting'],
  ['dance', 'Dance'], ['presentation_mc', 'Présentation / MC'],
  ['expression_corporelle', 'Expression corporelle'], ['prise_de_parole', 'Prise de parole'],
  ['makeup', 'Makeup'], ['autre', 'Autres talents'],
]

const GENDER_OPTIONS = [
  { value: 'femme', label: 'Femme' },
  { value: 'homme', label: 'Homme' },
]

const LEVEL_OPTIONS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'experimente', label: 'Expérimenté' },
]

const DAYS_OPTIONS = [
  { value: 'Lun', label: 'Lundi' },
  { value: 'Mar', label: 'Mardi' },
  { value: 'Mer', label: 'Mercredi' },
  { value: 'Jeu', label: 'Jeudi' },
  { value: 'Ven', label: 'Vendredi' },
  { value: 'Sam', label: 'Samedi' },
  { value: 'Dim', label: 'Dimanche' },
]

const DRAFT_KEY = 'yms_model_form_draft'

interface FormState {
  first_name: string; last_name: string; birth_date: string; gender: 'femme' | 'homme' | '';
  city: string; district: string; phone: string; whatsapp: string; email: string;
  emergency_contact_name: string; emergency_contact_phone: string; emergency_contact_relation: string;
  height_cm: string; weight_kg: string; shoe_size: string; clothing_size: string;
  chest_cm: string; waist_cm: string; hips_cm: string; hair_color: string; eye_color: string;
  distinguishing_features: string;
  level_yms: 'debutant' | 'intermediaire' | 'experimente' | '';
  experience_codes: string[]; experience_details: string;
  skill_codes: string[];
  available_runway: boolean; available_shooting: boolean; available_ad: boolean; available_event: boolean;
  available_days: string[]; available_hours: string; can_travel: boolean; travel_zone: string;
  accepted_rules: boolean; image_usage_consent: boolean; data_processing_consent: boolean;
  accuracy_confirmation: boolean; parent_name: string; parent_contact: string; parent_consent: boolean;
}

const initialState: FormState = {
  first_name: '', last_name: '', birth_date: '', gender: '', city: '', district: '',
  phone: '', whatsapp: '', email: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
  height_cm: '', weight_kg: '', shoe_size: '', clothing_size: '', chest_cm: '', waist_cm: '',
  hips_cm: '', hair_color: '', eye_color: '', distinguishing_features: '',
  level_yms: '', experience_codes: [], experience_details: '', skill_codes: [],
  available_runway: false, available_shooting: false, available_ad: false, available_event: false,
  available_days: [], available_hours: '', can_travel: false, travel_zone: '',
  accepted_rules: false, image_usage_consent: false, data_processing_consent: false,
  accuracy_confirmation: false, parent_name: '', parent_contact: '', parent_consent: false,
}

// Sauvegarde de brouillon : uniquement les champs non sensibles (pas de contact
// d'urgence, pas de consentements) sont persistés en sessionStorage (effacé à la
// fermeture de l'onglet), afin d'éviter la perte de saisie sans exposer de
// données sensibles dans un stockage durable comme localStorage.
const DRAFT_SAFE_FIELDS: (keyof FormState)[] = [
  'first_name', 'last_name', 'birth_date', 'gender', 'city', 'district',
  'height_cm', 'weight_kg', 'shoe_size', 'clothing_size', 'chest_cm', 'waist_cm', 'hips_cm',
  'hair_color', 'eye_color', 'distinguishing_features', 'level_yms', 'experience_codes',
  'experience_details', 'skill_codes', 'available_runway', 'available_shooting',
  'available_ad', 'available_event', 'available_days', 'available_hours', 'can_travel', 'travel_zone',
]

export function ModelForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(initialState)
  const [photos, setPhotos] = useState<Partial<Record<PhotoType, File>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Reprise du brouillon au montage
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setForm((f) => ({ ...f, ...parsed }))
      } catch {
        /* brouillon corrompu, ignoré */
      }
    }
  }, [])

  // Sauvegarde automatique (debounce simple)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const safeSubset = Object.fromEntries(
        DRAFT_SAFE_FIELDS.map((k) => [k, form[k]])
      )
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(safeSubset))
      setDraftSavedAt(new Date())
    }, 800)
    return () => clearTimeout(timeout)
  }, [form])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function sanitizePhone(value: string) {
    return value.replace(/\D/g, '').slice(0, 10)
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.first_name || !form.last_name || !form.birth_date || !form.gender || !form.city || !form.phone)
        return 'Merci de remplir tous les champs obligatoires.'
      if (!/^[0-9]{10}$/.test(form.phone))
        return 'Le numéro de téléphone doit contenir 10 chiffres et ne peut pas contenir de lettres.'
      if (form.whatsapp && !/^[0-9]{10}$/.test(form.whatsapp))
        return 'Le numéro WhatsApp doit contenir 10 chiffres et ne peut pas contenir de lettres.'
      if (!/^[0-9]{10}$/.test(form.emergency_contact_phone))
        return "Le contact d'urgence doit contenir exactement 10 chiffres."
      const isMinorProfile = form.birth_date ? isMinor(form.birth_date) : false
      if (isMinorProfile && form.parent_contact && !/^[0-9]{10}$/.test(form.parent_contact))
        return 'Le contact du parent/tuteur doit contenir 10 chiffres et ne peut pas contenir de lettres.'
    }
    if (step === 2) {
      if (!form.height_cm) return 'La taille est obligatoire.'
      const numericFields: [string, string, number, number][] = [
        ['Taille', form.height_cm, 100, 230],
        ['Poids', form.weight_kg, 30, 200],
        ['Pointure', form.shoe_size, 30, 50],
      ]
      for (const [label, value, min, max] of numericFields) {
        if (value && (!/^\d+(?:[.,]\d+)?$/.test(value) || Number(value.replace(',', '.')) < min || Number(value.replace(',', '.')) > max)) {
          return `${label} doit être un nombre compris entre ${min} et ${max}.`
        }
      }
    }
    if (step === 3 && !form.level_yms) return "Le niveau d'expérience est obligatoire."
    if (step === 4 && form.skill_codes.length === 0) return 'Sélectionne au moins une compétence.'
    if (step === 7) {
      if (!form.accepted_rules || !form.image_usage_consent || !form.data_processing_consent || !form.accuracy_confirmation)
        return 'Toutes les autorisations sont obligatoires.'
      if (form.birth_date && isMinor(form.birth_date)) {
        if (!form.parent_name || !form.parent_contact || !form.parent_consent)
          return 'Les informations du parent/tuteur sont obligatoires pour un mineur.'
      }
    }
    return null
  }

  function nextStep() {
    const error = validateStep()
    if (error) {
      showToast('error', error)
      return
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    setErrorMessage('')
    setSubmitting(true)
    try {
      const result = await submitApplication({ ...form, is_minor: isMinor(form.birth_date) }, photos)
      sessionStorage.removeItem(DRAFT_KEY)
      showToast('success', `Candidature envoyée (${result.applicationNumber}). YMS te contactera après examen.`)
      navigate('/client')
    } catch (err) {
      const message = formatErrorMessage(err, 'Erreur lors de la création du profil.')
      setErrorMessage(message)
      showToast('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  const minor = form.birth_date ? isMinor(form.birth_date) : false

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <StepProgress currentStep={step} totalSteps={STEP_LABELS.length} stepLabels={STEP_LABELS} />
      {draftSavedAt && (
        <p className="mb-4 text-xs text-gray-400">Brouillon sauvegardé à {draftSavedAt.toLocaleTimeString()}</p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" value={form.first_name} onChange={(v) => update('first_name', v)} placeholder="Ex. : Marie" />
              <Field label="Nom" value={form.last_name} onChange={(v) => update('last_name', v)} placeholder="Ex. : Rakoto" />
            </div>
             <BirthDateField value={form.birth_date} onChange={(v) => update('birth_date', v)} />
            <Field
              label="Sexe"
              value={form.gender}
              onChange={(v) => update('gender', v as 'femme' | 'homme')}
              options={GENDER_OPTIONS}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville" value={form.city} onChange={(v) => update('city', v)} placeholder="Ex. : Antananarivo" />
              <Field label="Quartier" value={form.district} onChange={(v) => update('district', v)} placeholder="Ex. : Analakely" required={false} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Téléphone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(v) => update('phone', sanitizePhone(v))}
                placeholder="Ex. : 0341234567"
                hint="10 chiffres uniquement"
              />
              <Field
                label="WhatsApp"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.whatsapp}
                onChange={(v) => update('whatsapp', sanitizePhone(v))}
                placeholder="Ex. : 0341234567"
                hint="10 chiffres uniquement"
                required={false}
              />
            </div>
            <Field label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="Ex. : marie@email.com" required={false} />
             <Field label="Contact d'urgence" type="tel" inputMode="numeric" maxLength={10} value={form.emergency_contact_phone} onChange={(v) => update('emergency_contact_phone', sanitizePhone(v))} placeholder="Ex. : 0341234567" hint="10 chiffres uniquement" />
            {minor && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Profil mineur détecté : une autorisation parentale sera demandée à l'étape 7.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Profil mannequin</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taille (cm)" type="number" value={form.height_cm} onChange={(v) => update('height_cm', v)} placeholder="Ex. : 175" min={100} max={230} />
              <Field label="Poids (kg)" type="number" value={form.weight_kg} onChange={(v) => update('weight_kg', v)} placeholder="Ex. : 60" min={30} max={200} required={false} />
              <Field label="Pointure" type="number" value={form.shoe_size} onChange={(v) => update('shoe_size', v)} placeholder="Ex. : 39" min={30} max={50} required={false} />
              <Field label="Taille vêtement" value={form.clothing_size} onChange={(v) => update('clothing_size', v)} required={false} />
              <Field label="Tour de poitrine" type="number" value={form.chest_cm} onChange={(v) => update('chest_cm', v)} required={false} />
              <Field label="Tour de taille" type="number" value={form.waist_cm} onChange={(v) => update('waist_cm', v)} required={false} />
              <Field label="Tour de hanches" type="number" value={form.hips_cm} onChange={(v) => update('hips_cm', v)} required={false} />
              <Field label="Couleur cheveux" value={form.hair_color} onChange={(v) => update('hair_color', v)} required={false} />
              <Field label="Couleur yeux" value={form.eye_color} onChange={(v) => update('eye_color', v)} required={false} />
            </div>
            <Field label="Particularités physiques" value={form.distinguishing_features} onChange={(v) => update('distinguishing_features', v)} required={false} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Expérience</h2>
            <Field
              label="Niveau"
              value={form.level_yms}
              onChange={(v) => update('level_yms', v as 'debutant' | 'intermediaire' | 'experimente')}
              options={LEVEL_OPTIONS}
            />
            <Field
              label="Types d'expériences"
              value={form.experience_codes}
              onChange={(v) => update('experience_codes', v as string[])}
              options={EXPERIENCES.map(([code, label]) => ({ value: code, label }))}
              multiple
              hint="Vous pouvez sélectionner plusieurs choix."
            />
            <Field label="Détails" value={form.experience_details} onChange={(v) => update('experience_details', v)} required={false} textarea />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Compétences</h2>
            <Field
              label="Compétences"
              value={form.skill_codes}
              onChange={(v) => update('skill_codes', v as string[])}
              options={SKILLS.map(([code, label]) => ({ value: code, label }))}
              multiple
              hint="Vous pouvez sélectionner plusieurs choix."
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Disponibilité</h2>
            <div className="grid grid-cols-2 gap-2">
              <CheckboxChip checked={form.available_runway} label="Défilé" onClick={() => update('available_runway', !form.available_runway)} />
              <CheckboxChip checked={form.available_shooting} label="Shooting" onClick={() => update('available_shooting', !form.available_shooting)} />
              <CheckboxChip checked={form.available_ad} label="Publicité" onClick={() => update('available_ad', !form.available_ad)} />
              <CheckboxChip checked={form.available_event} label="Événementiel" onClick={() => update('available_event', !form.available_event)} />
            </div>
            <Field
              label="Jours disponibles"
              value={form.available_days}
              onChange={(v) => update('available_days', v as string[])}
              options={DAYS_OPTIONS}
              multiple
              hint="Vous pouvez sélectionner plusieurs jours."
            />
            <Field label="Horaires disponibles" value={form.available_hours} onChange={(v) => update('available_hours', v)} required={false} />
            <CheckboxChip checked={form.can_travel} label="Possibilité de déplacement" onClick={() => update('can_travel', !form.can_travel)} />
            {form.can_travel && (
              <Field label="Zone de déplacement" value={form.travel_zone} onChange={(v) => update('travel_zone', v)} required={false} />
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {([
                ['portrait', 'Portrait naturelle'],
                ['full_body_front', 'Plein pied face'],
                ['full_body_profile', 'Plein pied profil'],
                ['three_quarter', 'Photo 3/4'],
                ['portfolio', 'Portfolio (optionnel)'],
              ] as [PhotoType, string][]).map(([type, label]) => (
                <PhotoUploadField key={type} label={label} onFileSelected={(f) => setPhotos((p) => ({ ...p, [type]: f ?? undefined }))} />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Autorisations</h2>
            <ConsentCheckbox checked={form.accepted_rules} onClick={() => update('accepted_rules', !form.accepted_rules)} label="J'accepte le règlement YMS" />
            <ConsentCheckbox checked={form.image_usage_consent} onClick={() => update('image_usage_consent', !form.image_usage_consent)} label="J'autorise l'utilisation de mon image" />
            <ConsentCheckbox checked={form.data_processing_consent} onClick={() => update('data_processing_consent', !form.data_processing_consent)} label="Je consens au traitement et à la conservation de mes informations" />
            <ConsentCheckbox checked={form.accuracy_confirmation} onClick={() => update('accuracy_confirmation', !form.accuracy_confirmation)} label="Je confirme l'exactitude des informations fournies" />

            {minor && (
              <div className="space-y-3 rounded-lg bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">Autorisation du parent / tuteur (mineur)</p>
                <Field label="Nom du parent/tuteur" value={form.parent_name} onChange={(v) => update('parent_name', v)} />
                <Field label="Contact du parent/tuteur" type="tel" inputMode="numeric" maxLength={10} value={form.parent_contact} onChange={(v) => update('parent_contact', sanitizePhone(v))} placeholder="Ex. : 0341234567" hint="10 chiffres uniquement" />
                <ConsentCheckbox checked={form.parent_consent} onClick={() => update('parent_consent', !form.parent_consent)} label="Le parent/tuteur autorise cette inscription" />
              </div>
            )}
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Confirmation</h2>
            <p className="text-sm text-gray-600">
              Vérifie que toutes les informations sont correctes avant l'envoi. Après validation,
              ton profil sera examiné par l'équipe YMS.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <p><strong>{form.first_name} {form.last_name}</strong> · {form.city}</p>
              <p>{form.height_cm} cm · Niveau {form.level_yms}</p>
              <p>{form.skill_codes.length} compétence(s), {Object.keys(photos).length} photo(s) sélectionnée(s)</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-30"
          >
            Précédent
          </button>
          {step < STEP_LABELS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-lg bg-yms-600 px-6 py-2 text-sm font-medium text-white hover:bg-yms-700"
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-yms-600 px-6 py-2 text-sm font-medium text-white hover:bg-yms-700 disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer mon profil'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BirthDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [manualDate, setManualDate] = useState(() => value ? value.split('-').reverse().join('/') : '')
  const maxDate = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    setManualDate(value ? value.split('-').reverse().join('/') : '')
  }, [value])

  function handleManualDate(nextValue: string) {
    const digits = nextValue.replace(/\D/g, '').slice(0, 8)
    const formatted = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/')
    setManualDate(formatted)
    if (digits.length !== 8) return
    const day = Number(digits.slice(0, 2))
    const month = Number(digits.slice(2, 4))
    const year = Number(digits.slice(4, 8))
    const parsed = new Date(year, month - 1, day)
    if (year >= 1900 && parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      onChange(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
  }

  return <div>
    <label className="mb-1 block text-sm font-medium text-gray-700">Date de naissance <span className="text-red-500">*</span></label>
    <div className="grid gap-2 sm:grid-cols-2">
      <input
        value={manualDate}
        onChange={(event) => handleManualDate(event.target.value)}
        inputMode="numeric"
        placeholder="JJ/MM/AAAA"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
      />
      <input
        type="date"
        value={value}
        min="1900-01-01"
        max={maxDate}
        onChange={(event) => {
          onChange(event.target.value)
          setManualDate(event.target.value ? event.target.value.split('-').reverse().join('/') : '')
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
      />
    </div>
    <p className="mt-1 text-xs text-gray-500">Saisissez directement la date ou utilisez le calendrier.</p>
  </div>
}

type FieldProps<T extends string | string[]> = {
  label: string
  value: T
  onChange: (v: T) => void
  type?: string
  required?: boolean
  textarea?: boolean
  options?: { value: string; label: string }[]
  multiple?: boolean
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search' | undefined
  maxLength?: number
  placeholder?: string
  hint?: string
  min?: number
  max?: number
}

function Field<T extends string | string[]>({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  textarea = false,
  options,
  multiple = false,
  inputMode,
  maxLength,
  placeholder,
  hint,
  min,
  max,
}: FieldProps<T>) {
  const isMultiple = multiple && Array.isArray(value)

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-gray-500">{hint}</p>}
      {textarea ? (
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value as T)}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
        />
      ) : options ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role={isMultiple ? 'group' : 'radiogroup'} aria-label={label}>
          {options.map((option) => {
            const selected = isMultiple ? (value as string[]).includes(option.value) : value === option.value
            return (
              <button
                key={option.value}
                type="button"
                role={isMultiple ? 'checkbox' : 'radio'}
                aria-checked={selected}
                onClick={() => {
                  if (isMultiple) {
                    const current = value as string[]
                    onChange((current.includes(option.value)
                      ? current.filter((item) => item !== option.value)
                      : [...current, option.value]) as T)
                  } else {
                    onChange(option.value as T)
                  }
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yms-500 focus:ring-offset-1 ${
                  selected
                    ? 'border-yms-600 bg-yms-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-yms-300 hover:bg-yms-50'
                }`}
              >
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded border border-current text-[10px]">
                  {selected ? '✓' : ''}
                </span>
                {option.label}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type={type}
          value={value as string}
          onChange={(e) => onChange(e.target.value as T)}
          inputMode={inputMode}
          maxLength={maxLength}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
        />
      )}
    </div>
  )
}

function CheckboxChip({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
        checked ? 'border-yms-600 bg-yms-50 text-yms-700' : 'border-gray-300 text-gray-600'
      }`}
    >
      {label}
    </button>
  )
}

function ConsentCheckbox({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left">
      <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${checked ? 'border-yms-600 bg-yms-600' : 'border-gray-300'}`}>
        {checked && <span className="text-xs text-white">✓</span>}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  )
}
