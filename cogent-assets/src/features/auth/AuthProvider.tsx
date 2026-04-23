import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchOrCreateProfile(sessionUser: User) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile not found — create it (first sign-in race condition guard)
      const { data: created } = await supabase
        .from('profiles')
        .insert({
          id: sessionUser.id,
          name:
            sessionUser.user_metadata?.full_name ??
            sessionUser.email?.split('@')[0] ??
            'Unknown',
          email: sessionUser.email ?? '',
          avatar_url: sessionUser.user_metadata?.avatar_url ?? null,
        })
        .select()
        .single()
      setProfile(created)
    } else {
      setProfile(data)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchOrCreateProfile(session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchOrCreateProfile(session.user)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
