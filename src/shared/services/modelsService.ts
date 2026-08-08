import { supabase } from '../../lib/supabase'
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
export async function searchModels(filters: ModelFilters) {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('models')
    .select(
      `
      *,
      model_measurements(*),
      availabilities(*)
      `,
      { count: 'exact' }
    )
    .range(from, to)
    .order('created_at', { ascending: false })

  if (filters.gender) query = query.eq('gender', filters.gender)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.level) query = query.eq('level_yms', filters.level)
  if (filters.city) query = query.ilike('city', `%${filters.city}%`)
  if (filters.searchText) {
    query = query.or(
      `first_name.ilike.%${filters.searchText}%,last_name.ilike.%${filters.searchText}%,yms_id.ilike.%${filters.searchText}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as unknown as Model[], count: count ?? 0 }
}

export async function exportModels(filters: ModelFilters) {
  let query = supabase
    .from('models')
    .select('yms_id, first_name, last_name, gender, birth_date, city, phone, email, level_yms, status')
    .order('created_at', { ascending: false })

  if (filters.gender) query = query.eq('gender', filters.gender)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.level) query = query.eq('level_yms', filters.level)
  if (filters.city) query = query.ilike('city', `%${filters.city}%`)
  if (filters.searchText) query = query.or(`first_name.ilike.%${filters.searchText}%,last_name.ilike.%${filters.searchText}%,yms_id.ilike.%${filters.searchText}%`)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getModelFullProfile(modelId: string, includeAdminNotes = false) {
  const { data: model, error } = await supabase.from('models').select('*').eq('id', modelId).single()
  if (error) throw error

  const [{ data: measurements }, { data: availability }, { data: skills }, { data: experiences }, { data: photos }] =
    await Promise.all([
      supabase.from('model_measurements').select('*').eq('model_id', modelId).maybeSingle(),
      supabase.from('availabilities').select('*').eq('model_id', modelId).maybeSingle(),
      supabase.from('model_skills').select('skills(*)').eq('model_id', modelId),
      supabase.from('model_experiences').select('details, experiences(*)').eq('model_id', modelId),
      supabase.from('model_photos').select('*').eq('model_id', modelId),
    ])

  let adminNotes = undefined
  if (includeAdminNotes) {
    const { data } = await supabase.from('admin_notes').select('*').eq('model_id', modelId)
    adminNotes = data ?? []
  }

  const fullProfile: ModelFullProfile = {
    ...(model as Model),
    measurements: measurements ?? null,
    availability: availability ?? null,
    // @ts-expect-error - jointure supabase typée en any ici, à affiner avec les types générés
    skills: (skills ?? []).map((s) => s.skills),
    // @ts-expect-error - idem
    experiences: (experiences ?? []).map((e) => ({ ...e.experiences, details: e.details })),
    photos: photos ?? [],
    admin_notes: adminNotes,
  }

  return fullProfile
}

export async function createModel(payload: Partial<Model>) {
  const { data, error } = await supabase.from('models').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateModel(modelId: string, payload: Partial<Model>) {
  const { data, error } = await supabase.from('models').update(payload).eq('id', modelId).select().single()
  if (error) throw error
  return data
}

// Admin uniquement (RLS le garantit côté serveur de toute façon)
export async function updateModelStatus(modelId: string, status: string) {
  const { error } = await supabase.from('models').update({ status }).eq('id', modelId)
  if (error) throw error
}

export async function deleteModel(modelId: string) {
  const { error } = await supabase.from('models').delete().eq('id', modelId)
  if (error) throw error
}

export async function getDashboardStats() {
  const { data, error } = await supabase.from('models').select('gender, status')
  if (error) throw error

  const stats = {
    total: data.length,
    femmes: data.filter((m) => m.gender === 'femme').length,
    hommes: data.filter((m) => m.gender === 'homme').length,
    actifs: data.filter((m) => m.status === 'actif').length,
    disponibles: data.filter((m) => m.status === 'disponible').length,
    indisponibles: data.filter((m) => m.status === 'indisponible').length,
    suspendus: data.filter((m) => m.status === 'suspendu').length,
  }
  return stats
}
