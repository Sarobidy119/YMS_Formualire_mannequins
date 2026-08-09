import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

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
      await admin.from('model_applications').update({ status: 'refusee', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_note: note }).eq('id', app.id)
      return Response.json({ ok: true }, { headers: corsHeaders })
    }
    if (decision !== 'approve') throw new Error('Décision invalide.')
    const userAppUrl = Deno.env.get('USER_APP_URL')?.replace(/\/$/, '')
    if (!userAppUrl) throw new Error('La variable USER_APP_URL est manquante dans les secrets Supabase.')
    const d = app.data as Record<string, any>
    const category = d.gender === 'femme' ? 'mannequin_femme' : 'mannequin_homme'
    const { data: model, error: modelError } = await admin.from('models').insert({ first_name: d.first_name, last_name: d.last_name, birth_date: d.birth_date, gender: d.gender, city: d.city, district: d.district || null, phone: d.phone, whatsapp: d.whatsapp || null, email: app.email, emergency_contact_name: d.emergency_contact_name, emergency_contact_phone: d.emergency_contact_phone, emergency_contact_relation: d.emergency_contact_relation, category, level_yms: d.level_yms || null }).select().single()
    if (modelError) throw modelError
    await admin.from('model_measurements').insert({ model_id: model.id, height_cm: Number(d.height_cm), weight_kg: d.weight_kg ? Number(d.weight_kg) : null, shoe_size: d.shoe_size ? Number(d.shoe_size) : null, clothing_size: d.clothing_size || null, chest_cm: d.chest_cm ? Number(d.chest_cm) : null, waist_cm: d.waist_cm ? Number(d.waist_cm) : null, hips_cm: d.hips_cm ? Number(d.hips_cm) : null, hair_color: d.hair_color || null, eye_color: d.eye_color || null, distinguishing_features: d.distinguishing_features || null })
    await admin.from('availabilities').insert({ model_id: model.id, available_runway: !!d.available_runway, available_shooting: !!d.available_shooting, available_ad: !!d.available_ad, available_event: !!d.available_event, available_days: d.available_days || [], available_hours: d.available_hours || null, can_travel: !!d.can_travel, travel_zone: d.travel_zone || null })
    if (Array.isArray(d.experience_codes) && d.experience_codes.length) {
      const { data: experiences } = await admin.from('experiences').select('id, code').in('code', d.experience_codes)
      if (experiences?.length) await admin.from('model_experiences').insert(experiences.map((e) => ({ model_id: model.id, experience_id: e.id, details: d.experience_details || null })))
    }
    if (Array.isArray(d.skill_codes) && d.skill_codes.length) {
      const { data: skills } = await admin.from('skills').select('id, code').in('code', d.skill_codes)
      if (skills?.length) await admin.from('model_skills').insert(skills.map((s) => ({ model_id: model.id, skill_id: s.id })))
    }
    await admin.from('consents').insert({ model_id: model.id, accepted_rules: !!d.accepted_rules, image_usage_consent: !!d.image_usage_consent, data_processing_consent: !!d.data_processing_consent, accuracy_confirmation: !!d.accuracy_confirmation, is_minor: !!d.is_minor, parent_name: d.parent_name || null, parent_contact: d.parent_contact || null, parent_consent: d.parent_consent || null })
    const paths = (app.photo_paths ?? []) as { type: string; path: string }[]
    if (paths.length) await admin.from('model_photos').insert(paths.map((p) => ({ model_id: model.id, photo_type: p.type, storage_path: p.path })))
    await admin.from('model_applications').update({ status: 'approuvee', model_id: model.id, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_note: note }).eq('id', app.id)
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(app.email, {
      data: { full_name: app.full_name },
      redirectTo: `${userAppUrl}/set-password`,
    })
    // Un utilisateur déjà créé n'a pas besoin d'une nouvelle invitation.
    if (inviteError && !/already (registered|exists)|already been registered/i.test(inviteError.message)) {
      throw new Error(`Candidature validée, mais l'email d'invitation n'a pas pu être envoyé : ${inviteError.message}`)
    }
    return Response.json({ ok: true, invitationSent: !inviteError }, { headers: corsHeaders })
  } catch (error) {
    // Une réponse 200 permet à l'interface d'afficher le diagnostic métier détaillé
    // plutôt que le message générique "Edge Function non-2xx".
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Erreur.' }, { headers: corsHeaders })
  }
})
