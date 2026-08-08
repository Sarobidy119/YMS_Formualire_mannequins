import { supabase } from '../../lib/supabase'
import { sanitizeFileName } from '../utils/formatters'
import { validatePhotoFile } from '../utils/fileValidators'
import type { PhotoType } from '../types/database.types'

export async function uploadModelPhoto(modelId: string, photoType: PhotoType, file: File) {
  const validationError = validatePhotoFile(file)
  if (validationError) throw new Error(validationError)

  const folderMap: Record<PhotoType, string> = {
    portrait: 'portrait',
    full_body_front: 'full-body-front',
    full_body_profile: 'full-body-profile',
    three_quarter: 'three-quarter',
    portfolio: 'portfolio',
  }

  const safeName = sanitizeFileName(file.name)
  const path = `${modelId}/${folderMap[photoType]}/${safeName}`

  const { error: uploadError } = await supabase.storage.from('model-photos').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('model_photos')
    .insert({
      model_id: modelId,
      photo_type: photoType,
      storage_path: path,
      mime_type: file.type,
      file_size_bytes: file.size,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSignedPhotoUrl(storagePath: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from('model-photos')
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

export async function deleteModelPhoto(photoId: string, storagePath: string) {
  const { error: storageError } = await supabase.storage.from('model-photos').remove([storagePath])
  if (storageError) throw storageError

  const { error } = await supabase.from('model_photos').delete().eq('id', photoId)
  if (error) throw error
}
