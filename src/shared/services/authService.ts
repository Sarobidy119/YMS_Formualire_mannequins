import { apiFetch, apiJson } from '../../lib/api'

export async function signUp(email: string, password: string, fullName: string) {
  const normalizedEmail = String(email).toLowerCase().trim()
  const normalizedFullName = String(fullName).trim()

  if (!normalizedFullName) {
    throw new Error('Le nom complet est requis.')
  }

  return apiJson<{ token: string; user: Record<string, unknown> }>('/auth/signup', {
    email: normalizedEmail,
    password,
    fullName: normalizedFullName,
  })
}

export async function signIn(email: string, password: string) {
  return apiJson('/auth/signin', { email, password })
}

export async function signOut() {
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

  const result = await apiFetch<{ user?: Record<string, unknown> }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return result.user || null
}
