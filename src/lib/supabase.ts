import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes. Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local'
  )
}

// IMPORTANT : uniquement la clé anon/publique ici. Jamais la clé service_role.
// NOTE : non paramétré par <Database> tant que les types ne sont pas générés
// automatiquement (voir README : `supabase gen types typescript`). Une fois
// générés, réactive `createClient<Database>(...)` pour un typage complet des
// tables, colonnes et jointures.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
