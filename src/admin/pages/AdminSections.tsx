import { CalendarDays, Activity, BarChart3, Settings } from 'lucide-react'

const content = {
  castings: { icon: CalendarDays, title: 'Castings', description: 'Préparez vos sélections pour les défilés, shootings et événements.', items: ['Créer une fiche de casting avec la date, le client et le lieu.', 'Rechercher les mannequins selon taille, compétences et disponibilités.', 'Conserver la liste des personnes sélectionnées.'] },
  activities: { icon: Activity, title: 'Activités', description: 'Suivez la participation des mannequins aux activités YMS.', items: ['Défilés et shootings réalisés.', 'Présences et dernières participations.', 'Notes de suivi accessibles uniquement à l’équipe YMS.'] },
  stats: { icon: BarChart3, title: 'Statistiques', description: 'Analysez votre effectif à partir des données enregistrées.', items: ['Répartition femmes / hommes.', 'Disponibilités et niveaux d’expérience.', 'Évolution de la base de mannequins.'] },
  settings: { icon: Settings, title: 'Paramètres', description: 'Configurez les règles internes de gestion YMS.', items: ['Accès et comptes administrateurs.', 'Règlement et textes de consentement.', 'Catégories et niveaux utilisés dans les formulaires.'] },
} as const

export function AdminSection({ section }: { section: keyof typeof content }) {
  const item = content[section]
  const Icon = item.icon
  return <div className="max-w-3xl space-y-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-yms-50 p-3 text-yms-700"><Icon size={24}/></div><div><h1 className="text-2xl font-bold text-gray-900">{item.title}</h1><p className="text-sm text-gray-500">{item.description}</p></div></div><section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="font-semibold text-gray-900">Module en préparation</h2><p className="mt-2 text-sm text-gray-600">La structure de données est prête. Ces fonctions seront ajoutées progressivement sans modifier les profils mannequins existants.</p><ul className="mt-5 space-y-3">{item.items.map((text) => <li key={text} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{text}</li>)}</ul></section></div>
}
