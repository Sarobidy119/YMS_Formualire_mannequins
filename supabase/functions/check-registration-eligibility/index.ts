import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email } = await req.json()
    if (!email) throw new Error('Adresse e-mail obligatoire.')
    const normalizedEmail = String(email).toLowerCase().trim()
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: applications, error: appError } = await admin
      .from('model_applications')
      .select('model_id')
      .ilike('email', normalizedEmail)
      .eq('status', 'approuvee')
      .not('model_id', 'is', null)
      .limit(1)

    if (appError) throw appError
    if (!applications?.length) return Response.json({ eligible: false }, { headers: corsHeaders })

    const approvedModelId = applications[0].model_id
    const { data: models, error: modelError } = await admin
      .from('models')
      .select('id')
      .eq('id', approvedModelId)
      .is('profile_id', null)
      .limit(1)

    if (modelError) throw modelError
    return Response.json({ eligible: !!models?.length }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erreur.' }, { status: 400, headers: corsHeaders })
  }
})
