import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, usernameToEmail } from './supabase'
import i18n from '../i18n'

export type Role = 'owner' | 'staff'
export interface Profile {
  id: string
  username: string
  display_name: string
  role: Role
  lang: 'th' | 'en' | 'my'
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  setLang: (lang: Profile['lang']) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setProfile(null); setLoading(false) } })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('id, username, display_name, role, lang')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        const p = data as Profile | null
        setProfile(p)
        if (p?.lang) i18n.changeLanguage(p.lang)
        setLoading(false)
      })
  }, [session])

  const signIn = async (username: string, password: string) => {
    if (!supabase) return 'not_configured'
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
    if (!error) return null
    console.warn('[login]', error.status, error.message)
    if (error.message === 'Invalid login credentials') return 'bad_login'
    return `other:${error.status ?? ''} ${error.message}`
  }

  const signOut = async () => { await supabase?.auth.signOut() }

  const setLang = async (lang: Profile['lang']) => {
    i18n.changeLanguage(lang)
    try { localStorage.setItem('lang', lang) } catch { /* ignore */ }
    if (supabase && profile) {
      await supabase.from('profiles').update({ lang }).eq('id', profile.id)
      setProfile({ ...profile, lang })
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, setLang }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
