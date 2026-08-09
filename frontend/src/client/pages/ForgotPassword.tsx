import { useState } from 'react'
import { requestPasswordReset } from '../../shared/services/authService'
import { useToast } from '../../shared/components/Toast'
import { formatErrorMessage } from '../../shared/utils/errorMessages'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    if (!email) {
      setErrorMessage('L’email est requis.')
      return
    }
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      const message = formatErrorMessage(err, 'Erreur lors de l’envoi du lien de réinitialisation.')
      setErrorMessage(message)
      showToast('error', message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
        {sent ? (
          <p className="mt-4 text-sm text-gray-600">
            Un email de réinitialisation a été envoyé à {email}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder="Ton email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-yms-500 focus:outline-none focus:ring-1 focus:ring-yms-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-yms-600 py-3 text-base font-medium text-white hover:bg-yms-700"
            >
              Envoyer le lien
            </button>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
