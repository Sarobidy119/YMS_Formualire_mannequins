import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { updatePassword } from '../../shared/services/authService'
import { formatErrorMessage } from '../../shared/utils/errorMessages'

interface SetPasswordProps {
  mode: 'invite' | 'reset'
}

export function SetPassword({ mode }: SetPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [validLink, setValidLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Vérification du lien…')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setValidLink(Boolean(session))
      setMessage(session ? '' : 'Ce lien est invalide ou a expiré. Demandez un nouveau lien.')
    })
    return () => { active = false }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setMessage('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirmation) return setMessage('Les deux mots de passe ne correspondent pas.')

    setLoading(true)
    setMessage('')
    try {
      await updatePassword(password)
      setMessage('Mot de passe enregistré. Vous pouvez maintenant vous connecter.')
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      setMessage(formatErrorMessage(error, 'Impossible de modifier le mot de passe.'))
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'invite' ? 'Créez votre mot de passe' : 'Réinitialisez votre mot de passe'
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mb-6 text-sm text-gray-500">Choisissez un mot de passe d'au moins 8 caractères.</p>
        {validLink && <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nouveau mot de passe" className="w-full rounded-lg border border-gray-300 px-4 py-3" />
          <input type="password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirmer le mot de passe" className="w-full rounded-lg border border-gray-300 px-4 py-3" />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-yms-600 py-3 font-medium text-white disabled:opacity-50">{loading ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}</button>
        </form>}
        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
        <p className="mt-5 text-sm"><Link to="/forgot-password" className="font-medium text-yms-600 hover:underline">Demander un nouveau lien</Link></p>
      </div>
    </div>
  )
}
