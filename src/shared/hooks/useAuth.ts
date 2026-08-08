import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../types/database.types'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single()

      if (mounted) {
        setProfile(error ? null : (data as unknown as Profile))
        setLoading(false)
      }
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadSession()
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { profile, loading, isAdmin: profile?.role === 'admin', isAuthenticated: !!profile }
}
