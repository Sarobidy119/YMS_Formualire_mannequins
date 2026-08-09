import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../../shared/services/authService'
import { checkRegistrationEligibility } from '../../shared/services/applicationsService'
import { useToast } from '../../shared/components/Toast'
import { formatErrorMessage } from '../../shared/utils/errorMessages'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    if (!fullName) {
      setErrorMessage('Le nom complet est requis.')
      return
    }
    if (!email) {
      setErrorMessage('L’email est requis.')
      return
    }
    if (!password) {
      setErrorMessage('Le mot de passe est requis.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    try {
      const eligible = await checkRegistrationEligibility(email)
      if (!eligible) {
        throw new Error("Votre candidature doit être validée par YMS avant la création du compte. Consultez l'email d'invitation après validation.")
      }
      await signUp(email, password, fullName)
      showToast('success', 'Compte créé. Vérifie ton email pour confirmer.')
      navigate('/login')
    } catch (err) {
      const message = formatErrorMessage(err, 'Erreur lors de la création du compte.')
      setErrorMessage(message)
      showToast('error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Créer un compte</h1>
        <p className="mb-6 text-sm text-gray-500">Espace mannequin YMS</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nom complet</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex. : Marie Rakoto"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex. : marie@email.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yms-600 py-3 text-base font-medium text-white hover:bg-yms-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-yms-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
