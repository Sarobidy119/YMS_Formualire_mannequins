import { apiFetch, apiJson } from '../../lib/api'

export async function signUp(email: string, password: string, fullName: string) {
  const normalizedEmail = String(email).toLowerCase().trim()
  const normalizedFullName = String(fullName).trim()

  if (!normalizedFullName) {
    throw new Error('Le nom complet est requis.')
  }

  const result = await apiJson<{ token: string; user: Record<string, unknown> }>('/auth/signup', {
    email: normalizedEmail,
    password,
    fullName: normalizedFullName,
  })

  if (result?.token) {
    localStorage.setItem('yms_token', result.token)
  }

  return result
}

export async function signIn(email: string, password: string) {
  const result = await apiJson<{ token: string; user: Record<string, unknown> }>('/auth/signin', { email, password })

  if (result?.token) {
    localStorage.setItem('yms_token', result.token)
  }

  return result
}

export async function signOut() {
  localStorage.removeItem('yms_token')
  return true
}

export async function requestPasswordReset(email: string) {
  return apiJson('/auth/request-password-reset', { email })
}

export async function updatePassword(newPassword: string) {
  return apiJson('/auth/update-password', { newPassword })
}

export async function getCurrentProfile() {
  const token = localStorage.getItem('yms_token')
  if (!token) return null

  const result = await apiFetch<{ user?: Record<string, unknown>; profile?: Record<string, unknown> }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // Prefer returning the linked model/profile when available (so components
  // like MyProfile receive the model id). Fall back to the user object.
  return (result.profile as unknown as Record<string, unknown>) || result.user || null
}
