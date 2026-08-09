export const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api')

export interface ApiResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  details?: unknown
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
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
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
    ...options,
  })
}
