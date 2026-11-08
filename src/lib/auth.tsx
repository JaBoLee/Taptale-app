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
  active: boolean
  approved_at: string | null
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<string | null>
  signUp: (username: string, displayName: string, password: string) => Promise<string | null>
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
      .select('id, username, display_name, role, lang, active, approved_at')
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

  const signUp = async (username: string, displayName: string, password: string) => {
    if (!supabase) return 'not_configured'
    const u = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) return 'bad_username'
    if (password.length < 8) return 'weak_password'
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(u), password, options: { data: { display_name: displayName.trim() || u } },
    })
    if (error) {
      console.warn('[signup]', error.status, error.message)
      return /already/i.test(error.message) ? 'username_taken' : 'failed'
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return 'username_taken'
    return null
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
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, setLang }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
