import { apiFetch, apiJson } from '../../lib/api'
import { sanitizeFileName } from '../utils/formatters'
import { validatePhotoFile } from '../utils/fileValidators'
import type { PhotoType } from '../types/database.types'

export async function uploadModelPhoto(modelId: string, photoType: PhotoType, file: File) {
  const validationError = validatePhotoFile(file)
  if (validationError) throw new Error(validationError)

  const safeName = sanitizeFileName(file.name)

  const data = new FormData()
  data.append('modelId', modelId)
  data.append('photoType', photoType)
  data.append('photo', file)
  data.append('filename', safeName)

  return apiJson('/models/photos/upload', data, {
    headers: undefined,
  })
}

export async function getSignedPhotoUrl(storagePath: string, _expiresInSeconds = 3600) {
  return apiFetch<string>(`/models/photos/sign?path=${encodeURIComponent(storagePath)}`)
}

export async function deleteModelPhoto(photoId: string, storagePath: string) {
  return apiFetch(`/models/photos/${photoId}?path=${encodeURIComponent(storagePath)}`, { method: 'DELETE' })
}
