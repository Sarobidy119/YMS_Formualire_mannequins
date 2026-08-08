import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { signIn } from '../../shared/services/authService'
import { useToast } from '../../shared/components/Toast'
import { formatErrorMessage } from '../../shared/utils/errorMessages'

interface LoginProps {
  admin?: boolean
  destination?: string
}

export function Login({ admin = false, destination = '/' }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    if (!email) return setErrorMessage("L’email est requis.")
    if (!password) return setErrorMessage('Le mot de passe est requis.')

    setLoading(true)
    try {
      await signIn(email, password)
      showToast('success', 'Connexion réussie')
      navigate(destination)
    } catch (err) {
      const message = formatErrorMessage(err, 'Erreur de connexion.')
      setErrorMessage(message)
      showToast('error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 ${admin ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-yms-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl ${admin ? 'border border-white/15 bg-white/95' : 'border border-gray-100 bg-white shadow-sm'}`}>
        <div className="mb-7">
          {admin ? (
            <img src="/logo.jpg" alt="Youth Malagasy Service" className="mb-4 h-14 w-14 rounded-2xl object-cover shadow-lg shadow-yms-900/20" />
          ) : (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yms-100 text-yms-700"><LockKeyhole size={23} /></div>
          )}
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yms-600">{admin ? 'Accès protégé' : 'Espace personnel'}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{admin ? 'YMS Administration' : 'Connexion à votre espace'}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">{admin ? 'Connectez-vous avec votre compte administrateur.' : 'Retrouvez votre dossier et votre profil mannequin.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-yms-500 focus:outline-none focus:ring-2 focus:ring-yms-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-yms-500 focus:outline-none focus:ring-2 focus:ring-yms-100" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-yms-600 py-3 text-base font-semibold text-white shadow-lg shadow-yms-600/20 transition hover:bg-yms-700 disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>

        <div className="mt-5 text-sm">
          <Link to="/forgot-password" className="font-medium text-yms-600 hover:underline">Mot de passe oublié ?</Link>
        </div>
      </div>
    </div>
  )
}
