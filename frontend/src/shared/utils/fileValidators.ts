import { photoValidation, documentValidation } from '../validation/modelSchema'

export function validatePhotoFile(file: File): string | null {
  if (!photoValidation.acceptedMimeTypes.includes(file.type)) {
    return 'Format non supporté. Utilise JPEG, PNG ou WebP.'
  }
  if (file.size > photoValidation.maxSizeBytes) {
    return 'Fichier trop volumineux (max 10 Mo).'
  }
  return null
}

export function validateDocumentFile(file: File): string | null {
  if (!documentValidation.acceptedMimeTypes.includes(file.type)) {
    return 'Format non supporté. Utilise PDF, JPEG ou PNG.'
  }
  if (file.size > documentValidation.maxSizeBytes) {
    return 'Fichier trop volumineux (max 10 Mo).'
  }
  return null
}
