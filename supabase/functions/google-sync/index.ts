// Edge Function: ส่งข้อมูลร้านไป Google Drive / Google Sheet ของบัญชีร้าน
// mode "backup" (ทุกวัน 07:00 + กดเองได้): ทุกตาราง 1 แท็บ + แท็บ "ต้องสั่ง" + ย้ายรูปใบเสร็จ/ใบปิดกะไป Drive + log
// mode "orders" (หลังนับสต๊อก/สั่งของ): อัปเดตเฉพาะแท็บ "ต้องสั่ง"
// secrets ที่ต้องมี: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (scope drive.file)
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const TZ = 'Asia/Bangkok'
const nowTh = () => new Date().toLocaleString('sv-SE', { timeZone: TZ })

// ───────── Google helpers ─────────
async function googleToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      refresh_token: Deno.env.get('GOOGLE_REFRESH_TOKEN') ?? '',
      grant_type: 'refresh_token',
    }),
  })
  const d = await res.json()
  if (!d.access_token) throw new Error('google_auth: ' + JSON.stringify(d))
  return d.access_token
}

async function g(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers ?? {}) } })
  const text = await res.text()
  if (!res.ok) throw new Error(`google ${res.status} ${url.split('?')[0]}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : {}
}

interface GState { folder_id?: string; photos_folder_id?: string; sheet_id?: string; sheet_url?: string }

async function ensureFiles(token: string, sb: SupabaseClient): Promise<Required<GState>> {
  const { data } = await sb.from('app_settings').select('value').eq('key', 'google').maybeSingle()
  const st: GState = (data?.value as GState) ?? {}
  const exists = async (id?: string) => {
    if (!id) return false
    try { const f = await g(token, `https://www.googleapis.com/drive/v3/files/${id}?fields=id,trashed`); return !f.trashed } catch { return false }
  }
  if (!(await exists(st.folder_id))) {
    const f = await g(token, 'https://www.googleapis.com/drive/v3/files', { method: 'POST', body: JSON.stringify({ name: 'Tap&Tale', mimeType: 'application/vnd.google-apps.folder' }) })
    st.folder_id = f.id; st.photos_folder_id = undefined; st.sheet_id = undefined
  }
  if (!(await exists(st.photos_folder_id))) {
    const f = await g(token, 'https://www.googleapis.com/drive/v3/files', { method: 'POST',
      body: JSON.stringify({ name: 'รูปใบเสร็จและใบปิดกะ', mimeType: 'application/vnd.google-apps.folder', parents: [st.folder_id] }) })
    st.photos_folder_id = f.id
  }
  if (!(await exists(st.sheet_id))) {
    const f = await g(token, 'https://www.googleapis.com/drive/v3/files', { method: 'POST',
      body: JSON.stringify({ name: 'Tap&Tale ข้อมูลร้าน', mimeType: 'application/vnd.google-apps.spreadsheet', parents: [st.folder_id] }) })
    st.sheet_id = f.id
    st.sheet_url = `https://docs.google.com/spreadsheets/d/${f.id}/edit`
  }
  await sb.from('app_settings').upsert({ key: 'google', value: st, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  return st as Required<GState>
}

async function writeTab(token: string, sheetId: string, title: string, rows: unknown[][]) {
  const meta = await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`)
  const sheets = (meta.sheets ?? []) as { properties: { title: string; sheetId: number } }[]
  if (!sheets.some((s) => s.properties.title === title)) {
    await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }) })
  }
  const range = encodeURIComponent(`'${title}'`)
  await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:clear`, { method: 'POST', body: '{}' })
  const values = rows.map((r) => r.map((v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v)))
  await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}!A1?valueInputOption=RAW`, {
    method: 'PUT', body: JSON.stringify({ values }) })
}

async function appendLog(token: string, sheetId: string, row: unknown[]) {
  const title = 'log'
  const meta = await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`)
  if (!(meta.sheets ?? []).some((s: { properties: { title: string } }) => s.properties.title === title)) {
    await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }) })
    await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/log!A1?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [['เวลา', 'โหมด', 'ผล']] }) })
  }
  await g(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/log!A1:append?valueInputOption=RAW`, {
    method: 'POST', body: JSON.stringify({ values: [row] }) })
}

// ───────── Data helpers ─────────
async function allRows(sb: SupabaseClient, table: string, order = 'id') {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select('*').order(order).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

function toRows(list: Record<string, unknown>[]) {
  if (!list.length) return [['(ไม่มีข้อมูล)']]
  const cols = Object.keys(list[0])
  return [cols, ...list.map((r) => cols.map((c) => r[c]))]
}

const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

async function ordersRows(sb: SupabaseClient) {
  const [items, suppliers, products, stock, marks] = await Promise.all([
    allRows(sb, 'items'), allRows(sb, 'suppliers'), allRows(sb, 'supplier_products'),
    allRows(sb, 'current_stock', 'item_id'), allRows(sb, 'purchase_marks'),
  ])
  const qty = new Map(stock.map((s) => [s.item_id as string, Number(s.qty)]))
  const ordered = new Set(marks.filter((m) => m.status === 'ordered').map((m) => m.supplier_product_id as string))
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: TZ })).getDay()
  const rows: unknown[][] = [['supplier', 'ชื่อสินค้า (ตาม supplier)', 'ชื่อที่ร้านเรียก', 'ลิงก์สินค้า', 'คงเหลือ', 'ขั้นต่ำ (safety stock)', 'หน่วย',
    'ควรสั่ง (แพ็ก)', 'ขนาดแพ็ก', 'รอบสั่ง', 'ถึงรอบวันนี้', 'อัปเดตล่าสุด']]
  const stamp = nowTh()
  for (const it of items.filter((i) => i.active)) {
    const safety = Number(it.safety_stock) || 0
    const q = qty.get(it.id as string) ?? 0
    if (!(safety > 0 && q < safety)) continue
    const sup = suppliers.find((s) => s.id === it.default_supplier_id)
    const sp = products.find((p) => p.item_id === it.id && p.supplier_id === it.default_supplier_id)
    if (sp && ordered.has(sp.id as string)) continue
    const short = Math.max(0, safety * 2 - q)
    const pack = sp ? Number(sp.pack_qty) || 1 : null
    const days = (sp?.order_weekdays as number[] | undefined) ?? []
    rows.push([sup?.name ?? '', sp?.product_name ?? '', it.name_th, sp?.url ?? '', q, safety, it.count_unit,
      pack ? Math.ceil(short / pack) : short, pack ?? '', days.map((d) => DAYS[d]).join(' '), days.includes(today) ? 'ใช่' : '', stamp])
  }
  if (rows.length === 1) rows.push(['ไม่มีของต้องสั่ง', '', '', '', '', '', '', '', '', '', '', stamp])
  return rows
}

async function syncPhotos(token: string, sb: SupabaseClient, folderId: string) {
  let moved = 0
  for (const table of ['receipts', 'shift_closes']) {
    const { data } = await sb.from(table).select('id, photo_path').is('drive_url', null).not('photo_path', 'is', null).limit(25)
    for (const r of (data ?? []) as { id: string; photo_path: string }[]) {
      const { data: blob, error } = await sb.storage.from('photos').download(r.photo_path)
      if (error || !blob) continue
      const boundary = 'tt' + crypto.randomUUID()
      const meta = JSON.stringify({ name: r.photo_path.replaceAll('/', '_'), parents: [folderId] })
      const body = new Blob([
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
        `--${boundary}\r\nContent-Type: ${blob.type || 'image/jpeg'}\r\n\r\n`, blob, `\r\n--${boundary}--`,
      ])
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': `multipart/related; boundary=${boundary}` }, body })
      if (!res.ok) { console.error('upload', await res.text()); continue }
      const f = await res.json()
      await sb.from(table).update({ drive_url: f.webViewLink }).eq('id', r.id)
      moved++
    }
  }
  return moved
}

// ───────── Handler ─────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb = createClient(url, service, { auth: { persistSession: false } })

  let body: { mode?: string } = {}
  try { body = await req.json() } catch { /* cron may send empty body */ }
  const mode = body.mode === 'orders' ? 'orders' : 'backup'

  // สิทธิ์: cron (CRON_SECRET), เจ้าของ (ทุกโหมด), สมาชิก (เฉพาะ orders)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const cronSecret = Deno.env.get('CRON_SECRET')
  let allowed = (!!cronSecret && req.headers.get('x-cron-secret') === cronSecret) || token === service
  if (!allowed && token) {
    const { data: u } = await sb.auth.getUser(token)
    if (u?.user) {
      const { data: me } = await sb.from('profiles').select('role, active').eq('id', u.user.id).single()
      allowed = !!me?.active && (me.role === 'owner' || mode === 'orders')
    }
  }
  if (!allowed) return json({ error: 'forbidden' }, 403)
  if (!Deno.env.get('GOOGLE_REFRESH_TOKEN')) return json({ error: 'google_not_connected' }, 400)

  let gt = ''
  let files: Required<GState> | null = null
  try {
    gt = await googleToken()
    files = await ensureFiles(gt, sb)
    await writeTab(gt, files.sheet_id, 'ต้องสั่ง', await ordersRows(sb))
    if (mode === 'orders') return json({ ok: true, mode, sheet_url: files.sheet_url })

    const tables = ['profiles', 'shift_types', 'shift_assignments', 'attendance', 'leave_requests', 'suppliers', 'items', 'supplier_products',
      'stock_events', 'menus', 'recipe_lines', 'kegs', 'keg_readings', 'receipts', 'shift_closes', 'cash_movements', 'ledger', 'purchase_marks']
    for (const tb of tables) {
      const order = tb === 'shift_types' ? 'code' : tb === 'recipe_lines' ? 'menu_id' : 'id'
      await writeTab(gt, files.sheet_id, tb, toRows(await allRows(sb, tb, order)))
    }
    await writeTab(gt, files.sheet_id, 'current_stock', toRows(await allRows(sb, 'current_stock', 'item_id')))
    const moved = await syncPhotos(gt, sb, files.photos_folder_id)
    await appendLog(gt, files.sheet_id, [nowTh(), mode, `ok · ${tables.length + 1} tabs · ${moved} photos`])
    return json({ ok: true, mode, tabs: tables.length + 2, photos: moved, sheet_url: files.sheet_url })
  } catch (e) {
    console.error(e)
    if (gt && files) { try { await appendLog(gt, files.sheet_id, [nowTh(), mode, 'ERROR ' + String(e).slice(0, 300)]) } catch { /* ignore */ } }
    return json({ error: 'sync_failed', detail: String(e).slice(0, 300) }, 500)
  }
})
