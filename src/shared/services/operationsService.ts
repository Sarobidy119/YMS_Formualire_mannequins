import { supabase } from '../../lib/supabase'

export interface Casting { id: string; name: string; client: string | null; event_date: string | null; type: string | null; created_at: string }
export interface ModelActivity { id: string; model_id: string; activity_type: string; description: string | null; created_at: string }

export async function listCastings() {
  const { data, error } = await supabase.from('castings').select('*').order('event_date', { ascending: true })
  if (error) throw error
  return data as Casting[]
}
export async function saveCasting(payload: Partial<Casting>) {
  const { id, ...values } = payload
  const query = id ? supabase.from('castings').update(values).eq('id', id) : supabase.from('castings').insert(values)
  const { error } = await query
  if (error) throw error
}
export async function removeCasting(id: string) { const { error } = await supabase.from('castings').delete().eq('id', id); if (error) throw error }

export async function listActivities() {
  const { data, error } = await supabase.from('model_activities').select('*, models(first_name,last_name,yms_id)').order('created_at', { ascending: false })
  if (error) throw error
  return data as (ModelActivity & { models: { first_name: string; last_name: string; yms_id: string } })[]
}
export async function saveActivity(payload: Partial<ModelActivity>) {
  const { id, ...values } = payload
  const query = id ? supabase.from('model_activities').update(values).eq('id', id) : supabase.from('model_activities').insert(values)
  const { error } = await query
  if (error) throw error
}
export async function removeActivity(id: string) { const { error } = await supabase.from('model_activities').delete().eq('id', id); if (error) throw error }
export async function getMyActivities(modelId: string) {
  const { data, error } = await supabase.from('model_activities').select('*').eq('model_id', modelId).order('created_at', { ascending: false })
  if (error) throw error
  return data as ModelActivity[]
}
