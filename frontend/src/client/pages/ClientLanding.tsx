import { Link } from 'react-router-dom'

export function ClientLanding() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yms-50 via-white to-violet-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white bg-white/90 p-6 shadow-xl shadow-yms-900/10 backdrop-blur sm:p-10">
        <div className="mx-auto mb-9 max-w-lg text-center">
          <img src="/logo.jpg" alt="Youth Malagasy Service" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-lg shadow-yms-900/20" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yms-600">YMS Models</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Bienvenue dans votre espace</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">Choisissez ce que vous souhaitez faire. Cet espace est réservé aux mannequins et aux candidatures.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/client/onboarding" className="group rounded-2xl bg-yms-600 p-6 text-left text-white shadow-lg shadow-yms-600/20 transition hover:-translate-y-1 hover:bg-yms-700">
            <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg">+</span>
            <span className="block text-lg font-bold">Je veux postuler</span>
            <span className="mt-1 block text-sm text-white/80">Créez votre dossier mannequin en quelques étapes.</span>
          </Link>
          <Link to="/login" className="group rounded-2xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-yms-300 hover:bg-yms-50">
            <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-yms-100 text-lg text-yms-700">→</span>
            <span className="block text-lg font-bold text-gray-900">J'ai déjà un compte</span>
            <span className="mt-1 block text-sm text-gray-500">Connectez-vous pour accéder à votre profil.</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
