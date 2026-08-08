// Types TypeScript reflétant le schéma PostgreSQL.
// En production, génère ces types automatiquement avec :
//   supabase gen types typescript --project-id <ref> > src/shared/types/database.types.ts

export type Role = 'admin' | 'model'
export type Gender = 'femme' | 'homme'
export type ModelStatus = 'actif' | 'disponible' | 'indisponible' | 'suspendu'
export type ModelCategory = 'mannequin_femme' | 'mannequin_homme'
export type ModelLevel = 'debutant' | 'intermediaire' | 'experimente'
export type PhotoType =
  | 'portrait'
  | 'full_body_front'
  | 'full_body_profile'
  | 'three_quarter'
  | 'portfolio'
export type DocumentType = 'cv' | 'parental_authorization' | 'other'

export interface Profile {
  id: string
  role: Role
  full_name: string
  created_at: string
}

export interface Model {
  id: string
  profile_id: string | null
  yms_id: string
  first_name: string
  last_name: string
  birth_date: string
  gender: Gender
  city: string
  district: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  emergency_contact_name: string
  emergency_contact_phone: string | null
  emergency_contact_relation: string
  status: ModelStatus
  category: ModelCategory
  level_yms: ModelLevel | null
  joined_date: string
  last_participation: string | null
  created_at: string
  updated_at: string
}

export interface ModelMeasurements {
  id: string
  model_id: string
  height_cm: number
  weight_kg: number | null
  shoe_size: number | null
  clothing_size: string | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  hair_color: string | null
  eye_color: string | null
  distinguishing_features: string | null
}

export interface Availability {
  id: string
  model_id: string
  available_runway: boolean
  available_shooting: boolean
  available_ad: boolean
  available_event: boolean
  available_days: string[]
  available_hours: string | null
  can_travel: boolean
  travel_zone: string | null
}

export interface Experience {
  id: string
  code: string
  label: string
}

export interface Skill {
  id: string
  code: string
  label: string
}

export interface ModelPhoto {
  id: string
  model_id: string
  photo_type: PhotoType
  storage_path: string
  mime_type: string | null
  file_size_bytes: number | null
  uploaded_at: string
}

export interface Consent {
  id: string
  model_id: string
  accepted_rules: boolean
  image_usage_consent: boolean
  data_processing_consent: boolean
  accuracy_confirmation: boolean
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  parent_consent: boolean | null
  consent_date: string
}

export interface AdminNote {
  id: string
  model_id: string
  note: string | null
  internal_rating: number | null
  author_id: string | null
  created_at: string
}

// Vue composée utilisée dans l'app (jointures)
export interface ModelFullProfile extends Model {
  measurements: ModelMeasurements | null
  availability: Availability | null
  skills: Skill[]
  experiences: (Experience & { details: string | null })[]
  photos: ModelPhoto[]
  admin_notes?: AdminNote[] // uniquement peuplé côté admin
}
