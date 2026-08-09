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
function buildQueryString(filters: ModelFilters) {
  const params = new URLSearchParams()

  if (filters.searchText) params.set('searchText', filters.searchText)
  if (filters.status) params.set('status', filters.status)
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.level) params.set('level', filters.level)
  if (filters.city) params.set('city', filters.city)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 50))

  return params.toString()
}

export async function searchModels(filters: ModelFilters) {
  const query = buildQueryString(filters)
  const result = await apiFetch<{ data: Model[]; count: number }>(`/models?${query}`)
  return {
    data: result.data || [],
    count: result.count ?? 0,
  }
}

export async function exportModels(filters: ModelFilters) {
  const query = buildQueryString(filters)
  const result = await apiFetch<{ data: Model[]; count: number }>(`/models?${query}`)
  return result.data || []
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
