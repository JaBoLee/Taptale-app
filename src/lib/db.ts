import { supabase } from './supabase'
import i18n from '../i18n'

/** ใช้หลังจากเช็ค isConfigured แล้วเท่านั้น */
export const sb = supabase!

export const TZ = 'Asia/Bangkok'

/** เลือกชื่อตามภาษาที่ใช้อยู่ ถ้าไม่มีให้ใช้ภาษาไทย */
export function pickName(row: { name_th?: string | null; name_en?: string | null; name_my?: string | null } | null | undefined): string {
  if (!row) return ''
  const lang = i18n.language
  if (lang === 'en' && row.name_en) return row.name_en
  if (lang === 'my' && row.name_my) return row.name_my
  return row.name_th ?? ''
}

export function pickSteps(row: { steps_th?: string | null; steps_en?: string | null; steps_my?: string | null }): string {
  const lang = i18n.language
  if (lang === 'en' && row.steps_en) return row.steps_en
  if (lang === 'my' && row.steps_my) return row.steps_my
  return row.steps_th ?? ''
}

const locale = () => (i18n.language === 'en' ? 'en-GB' : i18n.language === 'my' ? 'my-MM' : 'th-TH')

export const fmtNum = (n: number | null | undefined, digits = 2) =>
  n == null || Number.isNaN(n) ? '–' : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits })

export const fmtMoney = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) ? '–' : '฿' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString(locale(), { timeZone: TZ, day: 'numeric', month: 'short' }) : '–'

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString(locale(), { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–'

export const fmtTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '–'

/** วันที่แบบ YYYY-MM-DD ตามเวลาไทย */
export function ymd(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00+07:00')
  d.setDate(d.getDate() + n)
  return ymd(d)
}

/** วันจันทร์ของสัปดาห์ที่มีวันนั้น */
export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00+07:00')
  const dow = (d.getUTCDay() + 6) % 7
  return addDays(dateStr, -dow)
}

export const weekdayShort = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00+07:00').toLocaleDateString(locale(), { timeZone: TZ, weekday: 'short' })

/** แปลง "HH:MM" ของวันที่กำหนดเป็น Date (เวลาไทย) ถ้า end < start ถือว่าข้ามวัน */
export function shiftWindow(dateStr: string, start: string, end: string): { start: Date; end: Date } {
  const s = new Date(`${dateStr}T${start.slice(0, 5)}:00+07:00`)
  let e = new Date(`${dateStr}T${end.slice(0, 5)}:00+07:00`)
  if (e <= s) e = new Date(e.getTime() + 24 * 3600 * 1000)
  return { start: s, end: e }
}

/** อัปโหลดรูปลง Supabase Storage (bucket photos) คืน path */
export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${ymd()}/${crypto.randomUUID()}.${ext}`
  const { error } = await sb.storage.from('photos').upload(path, file, { contentType: file.type || 'image/jpeg' })
  if (error) throw error
  return path
}

export async function photoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null
  const { data } = await sb.storage.from('photos').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

/** ดาวน์โหลดข้อมูลเป็นไฟล์ CSV (เปิดใน Excel ได้ ภาษาไทยไม่เพี้ยน) */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface Settings {
  shop_location: { lat: number | null; lng: number | null; radius_m: number }
  late_rules: { grace_min: number; deduct_per_min: number; ot_per_min: number }
  leave_rules: { sick_days: number; sick_paid: boolean; personal_days: number; personal_paid: boolean }
  cash_tolerance: { amount: number }
  empty_keg_alert: { max_kegs: number; max_days: number }
  glass_sizes_ml: number[]
}

export async function loadSettings(): Promise<Partial<Settings>> {
  const { data } = await sb.from('app_settings').select('key, value')
  const out: Record<string, unknown> = {}
  for (const r of (data ?? []) as { key: string; value: unknown }[]) out[r.key] = r.value
  return out as Partial<Settings>
}

export interface ShiftType { code: string; start_time: string; end_time: string; sort: number }
export async function loadShiftTypes(): Promise<ShiftType[]> {
  const { data } = await sb.from('shift_types').select('*').order('sort')
  return (data as ShiftType[]) ?? []
}

export interface Member { id: string; display_name: string; role: string }
export async function loadMembers(): Promise<Member[]> {
  const { data } = await sb.rpc('list_members')
  return (data as Member[]) ?? []
}

export function errText(e: unknown): string {
  if (!e) return ''
  if (typeof e === 'string') return e
  const m = (e as { message?: string }).message
  return m ?? String(e)
}
