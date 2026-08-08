import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const form = await req.formData()
    const data = JSON.parse(String(form.get('data') ?? '{}'))
    if (!data.first_name || !data.last_name || !data.email || !data.birth_date || !data.gender || !data.height_cm) {
      throw new Error('Informations obligatoires manquantes.')
    }
    if (!/^\d{10}$/.test(String(data.emergency_contact_phone ?? ''))) {
      throw new Error("Le numéro d'urgence doit contenir exactement 10 chiffres.")
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const candidateId = crypto.randomUUID()
    const photoPaths: { type: string; path: string }[] = []
    for (const [key, value] of form.entries()) {
      if (!key.startsWith('photo_') || !(value instanceof File) || value.size === 0) continue
      if (!allowedTypes.has(value.type) || value.size > 5 * 1024 * 1024) throw new Error('Photo invalide (JPEG, PNG ou WebP, 5 Mo max).')
      const type = key.slice('photo_'.length)
      const extension = value.type.split('/')[1]
      const path = `${candidateId}/${type}.${extension}`
      const { error } = await admin.storage.from('application-uploads').upload(path, value, { contentType: value.type, upsert: false })
      if (error) throw error
      photoPaths.push({ type, path })
    }
    const { data: application, error } = await admin.from('model_applications').insert({
      id: candidateId, email: data.email.toLowerCase().trim(), full_name: `${data.first_name} ${data.last_name}`.trim(), data, photo_paths: photoPaths,
    }).select('application_number').single()
    if (error) throw error
    return Response.json({ applicationNumber: application.application_number }, { headers: corsHeaders })
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Erreur de soumission.' }, { status: 400, headers: corsHeaders }) }
})
