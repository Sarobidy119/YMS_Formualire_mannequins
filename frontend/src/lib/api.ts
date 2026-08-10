export const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api')

export interface ApiResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  details?: unknown
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    ...(init.headers || {}),
  } as Record<string, string>

  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message || 'Erreur API'
    const error = new Error(message)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  if (!payload || payload.success === false) {
    throw new Error(payload?.message || 'Erreur API')
  }

  return payload.data as T
}

export async function apiJson<T = unknown>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  const init: RequestInit = { method: 'POST', ...options }

  if (body instanceof FormData) {
    init.body = body
  } else {
    init.body = JSON.stringify(body ?? {})
  }

  return apiFetch<T>(path, init)
}
