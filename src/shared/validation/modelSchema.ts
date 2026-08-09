import { z } from 'zod'

// Messages d'erreur en français, validations alignées sur les contraintes PostgreSQL

export const personalInfoSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  birth_date: z
    .string()
    .refine((val) => new Date(val) < new Date(), 'La date de naissance doit être dans le passé'),
  gender: z.enum(['femme', 'homme'], { required_error: 'Le sexe est obligatoire' }),
  city: z.string().min(2, 'La ville est obligatoire'),
  district: z.string().optional(),
  phone: z.string().regex(/^[0-9+ ]{7,15}$/, 'Numéro de téléphone invalide'),
  whatsapp: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().regex(/^\d{10}$/, "Le contact d'urgence doit contenir exactement 10 chiffres"),
  emergency_contact_relation: z.string().optional(),
})

export const measurementsSchema = z.object({
  height_cm: z
    .number({ invalid_type_error: 'La taille est obligatoire' })
    .min(100, 'Taille minimale 100 cm')
    .max(230, 'Taille maximale 230 cm'),
  weight_kg: z.number().min(30).max(200).optional().nullable(),
  shoe_size: z.number().min(30).max(50).optional().nullable(),
  clothing_size: z.string().optional(),
  chest_cm: z.number().optional().nullable(),
  waist_cm: z.number().optional().nullable(),
  hips_cm: z.number().optional().nullable(),
  hair_color: z.string().optional(),
  eye_color: z.string().optional(),
  distinguishing_features: z.string().optional(),
})

export const experienceSchema = z.object({
  level_yms: z.enum(['debutant', 'intermediaire', 'experimente'], {
    required_error: "Le niveau d'expérience est obligatoire",
  }),
  experience_codes: z.array(z.string()).default([]),
  experience_details: z.string().optional(),
})

export const skillsSchema = z.object({
  skill_codes: z.array(z.string()).min(1, 'Sélectionne au moins une compétence'),
})

export const availabilitySchema = z.object({
  available_runway: z.boolean().default(false),
  available_shooting: z.boolean().default(false),
  available_ad: z.boolean().default(false),
  available_event: z.boolean().default(false),
  available_days: z.array(z.string()).default([]),
  available_hours: z.string().optional(),
  can_travel: z.boolean().default(false),
  travel_zone: z.string().optional(),
})

export const consentSchema = z
  .object({
    accepted_rules: z.literal(true, {
      errorMap: () => ({ message: 'Tu dois accepter le règlement YMS' }),
    }),
    image_usage_consent: z.literal(true, {
      errorMap: () => ({ message: "L'autorisation d'image est obligatoire" }),
    }),
    data_processing_consent: z.literal(true, {
      errorMap: () => ({ message: 'Le consentement au traitement des données est obligatoire' }),
    }),
    accuracy_confirmation: z.literal(true, {
      errorMap: () => ({ message: "Confirme l'exactitude des informations" }),
    }),
    is_minor: z.boolean().default(false),
    parent_name: z.string().optional(),
    parent_contact: z.string().optional(),
    parent_consent: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.is_minor || (data.parent_name && data.parent_contact && data.parent_consent),
    {
      message: 'Les informations du parent/tuteur sont obligatoires pour un mineur',
      path: ['parent_name'],
    }
  )

export const photoValidation = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 Mo
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

export const documentValidation = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 Mo
  acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
}

export const fullModelFormSchema = personalInfoSchema
  .merge(measurementsSchema)
  .merge(experienceSchema)
  .merge(skillsSchema)
  .merge(availabilitySchema)

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type MeasurementsInput = z.infer<typeof measurementsSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type SkillsInput = z.infer<typeof skillsSchema>
export type AvailabilityInput = z.infer<typeof availabilitySchema>
export type ConsentInput = z.infer<typeof consentSchema>
