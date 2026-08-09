import { useEffect, useState } from 'react'
import { getCurrentProfile } from '../services/authService'
import type { Profile } from '../types/database.types'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const sessionProfile = await getCurrentProfile()
        if (mounted) {
          setProfile((sessionProfile as unknown as Profile) || null)
          setLoading(false)
        }
      } catch {
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      mounted = false
    }
  }, [])

  return { profile, loading, isAdmin: profile?.role === 'admin', isAuthenticated: !!profile }
}
