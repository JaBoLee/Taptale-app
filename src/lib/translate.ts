import { sb } from './db'

export type TKind = 'ingredient' | 'menu' | 'steps' | 'text'

/** แปลภาษาไทยเป็นอังกฤษ/พม่า ผ่าน Edge Function translate คืน null ถ้าแปลไม่ได้ */
export async function autoTranslate(texts: string[], kind: TKind): Promise<{ en: string[]; my: string[] } | null> {
  const clean = texts.map((t) => t.trim())
  if (!clean.some(Boolean)) return null
  const { data, error } = await sb.functions.invoke('translate', { body: { texts: clean, kind } })
  if (error || !data || !Array.isArray(data.en) || !Array.isArray(data.my)) return null
  return { en: data.en as string[], my: data.my as string[] }
}
