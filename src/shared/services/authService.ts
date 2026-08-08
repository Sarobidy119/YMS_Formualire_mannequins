import { supabase } from '../../lib/supabase'

export async function signUp(email: string, password: string, fullName: string) {
  const normalizedEmail = String(email).toLowerCase().trim()
  const normalizedFullName = String(fullName).trim()

  if (!normalizedFullName) {
    throw new Error('Le nom complet est requis.')
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { full_name: normalizedFullName } },
  })
  if (error) {
    const supabaseError = error as unknown as { details?: unknown; hint?: unknown; message?: unknown }
    const details = String(supabaseError.details ?? '')
    const hint = String(supabaseError.hint ?? '')
    const message = String(supabaseError.message ?? '')
    const errorText = details || hint || message || 'Erreur serveur lors de la création du compte.'
    throw new Error(errorText)
  }
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getCurrentProfile() {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .single()

  if (error) throw error
  return data
}
