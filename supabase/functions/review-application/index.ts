import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error('Non authentifié.')
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Accès administrateur requis.')
    const { applicationId, decision, note = '' } = await req.json()
    const { data: app, error } = await admin.from('model_applications').select('*').eq('id', applicationId).single()
    if (error || !app || app.status !== 'en_attente') throw new Error('Candidature introuvable ou déjà traitée.')
    if (decision === 'reject') {
      const { error: rejectError } = await admin.from('model_applications').update({ status: 'refusee', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_note: note }).eq('id', app.id)
      throwIfError(rejectError)
      return Response.json({ ok: true }, { headers: corsHeaders })
    }
    if (decision !== 'approve') throw new Error('Décision invalide.')
    // Une candidature doit pouvoir être validée même si l'URL de l'espace
    // mannequin n'est pas encore configurée. Dans ce cas seule l'invitation
    // est reportée, jamais la création de la fiche.
    const userAppUrl = Deno.env.get('USER_APP_URL')?.replace(/\/$/, '')
    const d = app.data as Record<string, any>
    const category = d.gender === 'femme' ? 'mannequin_femme' : 'mannequin_homme'
    // Les anciennes colonnes nom/lien sont encore obligatoires sur certaines
    // bases déjà déployées. Les valeurs de compatibilité évitent de bloquer
    // une validation pendant que la migration 021 est appliquée.
    const { data: model, error: modelError } = await admin.from('models').insert({ first_name: d.first_name, last_name: d.last_name, birth_date: d.birth_date, gender: d.gender, city: d.city, district: d.district || null, phone: d.phone, whatsapp: d.whatsapp || null, email: app.email, emergency_contact_name: d.emergency_contact_name || 'Contact d’urgence', emergency_contact_phone: d.emergency_contact_phone, emergency_contact_relation: d.emergency_contact_relation || 'Non renseigné', category, level_yms: d.level_yms || null }).select().single()
    if (modelError) throw modelError
    const { error: measurementsError } = await admin.from('model_measurements').insert({ model_id: model.id, height_cm: Number(d.height_cm), weight_kg: d.weight_kg ? Number(d.weight_kg) : null, shoe_size: d.shoe_size ? Number(d.shoe_size) : null, clothing_size: d.clothing_size || null, chest_cm: d.chest_cm ? Number(d.chest_cm) : null, waist_cm: d.waist_cm ? Number(d.waist_cm) : null, hips_cm: d.hips_cm ? Number(d.hips_cm) : null, hair_color: d.hair_color || null, eye_color: d.eye_color || null, distinguishing_features: d.distinguishing_features || null })
    throwIfError(measurementsError)
    const { error: availabilitiesError } = await admin.from('availabilities').insert({ model_id: model.id, available_runway: !!d.available_runway, available_shooting: !!d.available_shooting, available_ad: !!d.available_ad, available_event: !!d.available_event, available_days: d.available_days || [], available_hours: d.available_hours || null, can_travel: !!d.can_travel, travel_zone: d.travel_zone || null })
    throwIfError(availabilitiesError)
    if (Array.isArray(d.experience_codes) && d.experience_codes.length) {
      const { data: experiences } = await admin.from('experiences').select('id, code').in('code', d.experience_codes)
      if (experiences?.length) {
        const { error: experiencesError } = await admin.from('model_experiences').insert(experiences.map((e) => ({ model_id: model.id, experience_id: e.id, details: d.experience_details || null })))
        throwIfError(experiencesError)
      }
    }
    if (Array.isArray(d.skill_codes) && d.skill_codes.length) {
      const { data: skills } = await admin.from('skills').select('id, code').in('code', d.skill_codes)
      if (skills?.length) {
        const { error: skillsError } = await admin.from('model_skills').insert(skills.map((s) => ({ model_id: model.id, skill_id: s.id })))
        throwIfError(skillsError)
      }
    }
    const { error: consentsError } = await admin.from('consents').insert({ model_id: model.id, accepted_rules: !!d.accepted_rules, image_usage_consent: !!d.image_usage_consent, data_processing_consent: !!d.data_processing_consent, accuracy_confirmation: !!d.accuracy_confirmation, is_minor: !!d.is_minor, parent_name: d.parent_name || null, parent_contact: d.parent_contact || null, parent_consent: d.parent_consent || null })
    throwIfError(consentsError)
    const paths = (app.photo_paths ?? []) as { type: string; path: string }[]
    if (paths.length) {
      const { error: photosError } = await admin.from('model_photos').insert(paths.map((p) => ({ model_id: model.id, photo_type: p.type, storage_path: p.path })))
      throwIfError(photosError)
    }
    const { error: approvalError } = await admin.from('model_applications').update({ status: 'approuvee', model_id: model.id, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_note: note }).eq('id', app.id)
    throwIfError(approvalError)
    const inviteError = userAppUrl
      ? (await admin.auth.admin.inviteUserByEmail(app.email, {
          data: { full_name: app.full_name },
          redirectTo: `${userAppUrl}/set-password`,
        })).error
      : { message: 'Invitation non envoyée : USER_APP_URL est absent des secrets Supabase.' }
    // L'email ne doit jamais annuler une validation déjà enregistrée.
    // L'administrateur peut vérifier les logs Supabase et renvoyer une invitation si besoin.
    return Response.json({ ok: true, invitationSent: !inviteError, invitationError: inviteError?.message ?? null }, { headers: corsHeaders })
  } catch (error) {
    // Une réponse 200 permet à l'interface d'afficher le diagnostic métier détaillé
    // plutôt que le message générique "Edge Function non-2xx".
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Erreur.' }, { headers: corsHeaders })
  }
})
