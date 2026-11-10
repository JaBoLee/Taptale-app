// Edge Function: แปลข้อความภาษาไทยเป็นอังกฤษและพม่า
// - ถ้ามี secret ANTHROPIC_API_KEY ใช้ Claude (แม่นกว่า เข้าใจบริบทร้านอาหาร/บาร์)
// - ถ้าไม่มี ใช้ MyMemory (ฟรี จำกัดประมาณ 5,000 ตัวอักษร/วัน)
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

type Kind = 'ingredient' | 'menu' | 'steps' | 'text'

async function viaClaude(key: string, texts: string[], kind: Kind) {
  const hint = kind === 'ingredient' ? 'ingredient or supply names for a bar kitchen stock list (keep them short)'
    : kind === 'menu' ? 'dish names on a craft-beer bar menu (keep them short and natural)'
    : kind === 'steps' ? 'cooking instructions for kitchen staff (keep line breaks)'
    : 'short texts used in a bar back-office app'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-5-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Translate these Thai ${hint} into English and Burmese (Myanmar script). ` +
          `Reply with JSON only, shaped {"en": [...], "my": [...]}, same order and length as the input.\n\n` +
          JSON.stringify(texts),
      }],
    }),
  })
  if (!res.ok) throw new Error(`claude ${res.status}`)
  const data = await res.json()
  const text: string = data.content?.[0]?.text ?? ''
  const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
  return { en: parsed.en as string[], my: parsed.my as string[] }
}

async function viaMyMemory(texts: string[]) {
  const one = async (t: string, lang: string) => {
    if (!t.trim()) return ''
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=th|${lang}`)
    const d = await r.json()
    return String(d?.responseData?.translatedText ?? '')
  }
  const en = await Promise.all(texts.map((t) => one(t, 'en')))
  const my = await Promise.all(texts.map((t) => one(t, 'my')))
  return { en, my }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: u } = await sb.auth.getUser(token)
  if (!u?.user) return json({ error: 'unauthorized' }, 401)
  const { data: me } = await sb.from('profiles').select('active').eq('id', u.user.id).single()
  if (!me?.active) return json({ error: 'forbidden' }, 403)

  let body: { texts?: unknown; kind?: Kind }
  try { body = await req.json() } catch { return json({ error: 'bad_json' }, 400) }
  const texts = Array.isArray(body.texts) ? body.texts.map((x) => String(x ?? '')).slice(0, 30) : []
  if (!texts.length) return json({ en: [], my: [] })
  if (texts.join('').length > 4000) return json({ error: 'too_long' }, 400)

  const key = Deno.env.get('ANTHROPIC_API_KEY')
  try {
    if (key) {
      try { return json({ ...(await viaClaude(key, texts, body.kind ?? 'text')), provider: 'claude' }) } catch (e) { console.error(e) }
    }
    return json({ ...(await viaMyMemory(texts)), provider: 'mymemory' })
  } catch (e) {
    console.error(e)
    return json({ error: 'translate_failed' }, 502)
  }
})
