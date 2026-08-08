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
    const { applicationId } = await req.json()
    const { data: application, error } = await admin.from('model_applications').select('photo_paths').eq('id', applicationId).single()
    if (error) throw error
    const paths = (application.photo_paths ?? []).map((item: { path: string }) => item.path)
    const { data, error: signedError } = await admin.storage.from('application-uploads').createSignedUrls(paths, 600)
    if (signedError) throw signedError
    return Response.json({ photos: data ?? [] }, { headers: corsHeaders })
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Erreur.' }, { status: 400, headers: corsHeaders }) }
})
