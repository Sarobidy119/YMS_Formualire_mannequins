import { apiFetch, apiJson } from '../../lib/api'

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
  const payload = {
    ...data,
    photos: Object.fromEntries(
      Object.entries(photos).filter(([, file]) => Boolean(file)).map(([type, file]) => [type, file?.name])
    ),
  }

  const formData = new FormData()
  formData.append('payload', JSON.stringify(payload))

  Object.entries(photos).forEach(([type, file]) => {
    if (!file) return
    formData.append(`photo_${type}`, file)
  })

  return apiJson<{ applicationNumber: string }>('/applications', formData, { headers: undefined })
}

export async function checkRegistrationEligibility(email: string) {
  const normalizedEmail = String(email).toLowerCase().trim()
  const result = await apiJson<{ eligible?: boolean }>('/applications/eligibility', { email: normalizedEmail })
  return Boolean((result as { eligible?: boolean } | undefined)?.eligible)
}

export async function listApplications() {
  const result = await apiFetch<ModelApplication[]>('/applications')
  return result
}

export async function getApplicationPhotoUrls(_applicationId: string) {
  try {
    const result = await apiFetch<{ path: string; signedUrl: string | null }[]>(`/applications/${encodeURIComponent(_applicationId)}/photos`)
    return result || []
  } catch (error) {
    return []
  }
}

export async function reviewApplication(applicationId: string, decision: 'approve' | 'reject', note = '') {
  const result = await apiJson<{ ok?: boolean; error?: string; decision?: string }>('/applications/review', {
    applicationId,
    decision,
    note,
  })

  if (result?.ok === false) throw new Error('Impossible de traiter la candidature.')
  return result
}
