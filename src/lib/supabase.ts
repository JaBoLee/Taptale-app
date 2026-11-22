import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ddmltpvqvuvxqcflrrvj.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

/** Supabase Auth ต้องใช้อีเมล จึงแปลง username เป็นอีเมลภายในของร้าน */
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@taptale.local`
