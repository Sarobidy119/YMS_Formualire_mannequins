import { supabase } from '../../lib/supabase'

export interface ModelApplication {
  id: string
  application_number: string
  email: string
  full_name: string
  data: Record<string, unknown>
  photo_paths: { type: string; path: string }[]
  status: 'en_attente' | 'approuvee' | 'refusee'
  review_note: string | null
  created_at: string
}

export async function submitApplication(data: Record<string, unknown>, photos: Record<string, File | undefined>) {
  const body = new FormData()
  body.append('data', JSON.stringify(data))
  Object.entries(photos).forEach(([type, file]) => {
    if (file) body.append(`photo_${type}`, file)
  })
  const { data: result, error } = await supabase.functions.invoke('submit-application', { body })
  if (error) {
    const response = error.context as Response | undefined
    const payload = response ? await response.json().catch(() => null) as { error?: string } | null : null
    throw new Error(payload?.error || error.message || 'Impossible d’envoyer la candidature.')
  }
  return result as { applicationNumber: string }
}

export async function checkRegistrationEligibility(email: string) {
  const normalizedEmail = String(email).toLowerCase().trim()
  const { data, error } = await supabase.functions.invoke('check-registration-eligibility', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (error) {
    const response = error.context as Response | undefined
    const payload = response ? await response.json().catch(() => null) as { error?: string } | null : null
    const message = payload?.error || error.message || String(error)
    throw new Error(message)
  }

  return Boolean((data as { eligible?: boolean } | null)?.eligible)
}

export async function listApplications() {
  const { data, error } = await supabase.from('model_applications').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as ModelApplication[]
}

export async function getApplicationPhotoUrls(applicationId: string) {
  const { data, error } = await supabase.functions.invoke('get-application-photos', { body: { applicationId } })
  if (error) throw new Error('Impossible de charger les photos de cette candidature.')
  return ((data as { photos?: { path: string; signedUrl: string | null }[] } | null)?.photos ?? []).filter((photo) => photo.signedUrl)
}

export async function reviewApplication(applicationId: string, decision: 'approve' | 'reject', note = '') {
  // Ne laissons jamais l'Edge Function recevoir un jeton expiré : dans ce cas
  // Supabase renvoie un 401 générique, qui était affiché comme une simple
  // notification d'erreur dans l'administration.
  let { data: { session } } = await supabase.auth.getSession()
  if (!session || new Date(session.expires_at ? session.expires_at * 1000 : 0) <= new Date()) {
    const { data, error: refreshError } = await supabase.auth.refreshSession()
    session = data.session
    if (refreshError || !session) {
      await supabase.auth.signOut({ scope: 'local' })
      throw new Error('Votre session administrateur a expiré. Reconnectez-vous avant de valider une candidature.')
    }
  }

  const { error: userError } = await supabase.auth.getUser(session.access_token)
  if (userError) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('Votre session administrateur n’est plus valide. Reconnectez-vous avant de valider une candidature.')
  }

  const { data, error } = await supabase.functions.invoke('review-application', {
    body: { applicationId, decision, note },
  })
  if (error) {
    const response = error.context as Response | undefined
    const payload = response ? await response.json().catch(() => null) as { error?: string } | null : null
    const message = payload?.error || error.message || 'Impossible de traiter la candidature.'
    if (/jwt|non authentifi|unauthori[sz]ed|session/i.test(message)) {
      await supabase.auth.signOut({ scope: 'local' })
      throw new Error('Votre session administrateur a expiré. Reconnectez-vous avant de réessayer.')
    }
    throw new Error(message)
  }
  const result = data as { ok?: boolean; error?: string } | null
  if (result?.ok === false) throw new Error(result.error || 'Impossible de traiter la candidature.')
  return data
}
