import { apiFetch } from '../../lib/api'
import type { Model, ModelFullProfile } from '../types/database.types'

export interface ModelFilters {
  gender?: 'femme' | 'homme'
  minHeight?: number
  maxHeight?: number
  clothingSize?: string
  shoeSize?: number
  level?: string
  skillCode?: string
  city?: string
  status?: string
  searchText?: string
  page?: number
  pageSize?: number
}

// Recherche paginée côté serveur avec filtres combinés.
// NB : filtrer sur measurements/skills nécessite un rpc ou une vue dédiée en prod
// pour rester performant à grande échelle ; ci-dessous une implémentation
// simple à base de jointures via .select() imbriqué, à optimiser avec un
// index composite / vue matérialisée si le volume dépasse quelques milliers de lignes.
export async function searchModels(_filters: ModelFilters) {
  const result = await apiFetch<{ data: Model[]; count: number }>('/models')
  return {
    data: result.data || [],
    count: result.count ?? 0,
  }
}

export async function exportModels(_filters: ModelFilters) {
  return apiFetch<any[]>('/models')
}

export async function getModelFullProfile(modelId: string, _includeAdminNotes = false) {
  return apiFetch<ModelFullProfile>(`/models/${modelId}`)
}

export async function createModel(payload: Partial<Model>) {
  return apiFetch('/models', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateModel(modelId: string, payload: Partial<Model>) {
  return apiFetch(`/models/${modelId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateModelStatus(modelId: string, status: string) {
  return apiFetch(`/models/${modelId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteModel(modelId: string) {
  return apiFetch(`/models/${modelId}`, {
    method: 'DELETE',
  })
}

export async function getDashboardStats() {
  const result = await apiFetch<{
    total: number
    femmes: number
    hommes: number
    actifs: number
    disponibles: number
    indisponibles: number
    suspendus: number
  }>('/admin/dashboard')

  return result
}
