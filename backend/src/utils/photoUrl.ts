export function resolvePhotoPublicUrl(pathOrUrl: string | null | undefined, baseUrl = '') {
  if (!pathOrUrl) return null

  const value = String(pathOrUrl).trim()
  if (!value) return null

  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('data:')) return value

  const normalized = value.replace(/^\\+/, '').replace(/^\/+/, '')
  const withoutUploadsPrefix = normalized.replace(/^uploads\//i, '')

  if (!baseUrl) return `/uploads/${withoutUploadsPrefix}`

  const origin = baseUrl.replace(/\/$/, '')
  return `${origin}/uploads/${withoutUploadsPrefix}`
}
