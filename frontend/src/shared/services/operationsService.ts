import { apiFetch, apiJson } from '../../lib/api'

export interface Casting { id: string; name: string; client: string | null; event_date: string | null; type: string | null; created_at: string }
export interface ModelActivity { id: string; model_id: string; activity_type: string; description: string | null; created_at: string }

export async function listCastings() {
  return apiFetch<Casting[]>('/admin/castings')
}
export async function saveCasting(payload: Partial<Casting>) {
  return apiJson('/admin/castings', payload)
}
export async function removeCasting(id: string) {
  return apiFetch(`/admin/castings/${id}`, { method: 'DELETE' })
}

export async function listActivities() {
  return apiFetch<(ModelActivity & { models: { first_name: string; last_name: string; yms_id: string } })[]>('/admin/activities')
}
export async function saveActivity(payload: Partial<ModelActivity>) {
  return apiJson('/admin/activities', payload)
}
export async function removeActivity(id: string) {
  return apiFetch(`/admin/activities/${id}`, { method: 'DELETE' })
}
export async function getMyActivities(modelId: string) {
  return apiFetch<ModelActivity[]>(`/models/${modelId}/activities`)
}
