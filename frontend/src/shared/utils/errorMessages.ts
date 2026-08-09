export function formatErrorMessage(error: unknown, fallback: string) {
  let message = ''
  let details = ''

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object') {
    message = String((error as { message?: unknown }).message ?? '')
    details = String((error as { details?: unknown }).details ?? '')
    if (!message) message = String((error as { hint?: unknown }).hint ?? '')
  }

  if (!message) message = fallback
  const normalized = `${message} ${details}`.toLowerCase()

  if (normalized.includes('database error saving new user')) {
    if (details) return details
    if (message.includes('inscription refusée')) return 'Ton email n’est pas lié à une candidature YMS approuvée.'
    if (message.includes('already associated') || message.includes('déjà associé')) return 'Ce compte mannequin est déjà associé à un utilisateur.'
    return 'Inscription impossible : le compte ne peut pas être créé avec cette adresse email.'
  }
  if (normalized.includes('inscription refusée')) {
    return 'Ton email n’est pas lié à une candidature YMS approuvée.'
  }
  if (normalized.includes('déjà associé')) {
    return 'Ce compte mannequin est déjà associé à un utilisateur.'
  }
  if (normalized.includes('invalid login credentials')) {
    return 'Email ou mot de passe invalide.'
  }
  if (normalized.includes('invalid password')) {
    return 'Mot de passe invalide.'
  }
  if (normalized.includes('password should be at least 8 characters')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  if (normalized.includes('user already registered')) {
    return 'Cet email est déjà utilisé. Essaie de te connecter.'
  }
  if (normalized.includes('account already exists')) {
    return 'Cet email est déjà utilisé. Essaie de te connecter.'
  }
  if (normalized.includes('invalid email')) {
    return 'Adresse email invalide.'
  }
  if (normalized.includes('user not found')) {
    return 'Utilisateur introuvable. Vérifie ton email.'
  }
  if (normalized.includes('duplicate key value violates unique constraint')) {
    return 'Cet email est déjà enregistré.'
  }
  if (normalized.includes('verification')) {
    return 'Vérifie ton email ou réessaie plus tard.'
  }
  if (normalized.includes('network error') || normalized.includes('failed to fetch')) {
    return 'Erreur réseau. Vérifie ta connexion internet.'
  }
  if (normalized.includes('invalid login') || normalized.includes('not allowed')) {
    return 'Connexion refusée. Vérifie ton email et ton mot de passe.'
  }
  if (normalized.includes('database error saving new user')) {
    return 'Erreur serveur lors de la création du compte. Vérifie tes informations et réessaie.'
  }

  return message || fallback
}
