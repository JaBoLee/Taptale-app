import { sb } from './db'

/** อัปเดตแท็บ "ต้องสั่ง" ใน Google Sheet เบื้องหลัง (ไม่ต้องรอ ไม่แจ้ง error) */
export function pushOrders() {
  sb.functions.invoke('google-sync', { body: { mode: 'orders' } }).catch(() => { /* ignore */ })
}

export async function backupNow(): Promise<{ ok: boolean; detail?: string; sheet_url?: string }> {
  const { data, error } = await sb.functions.invoke('google-sync', { body: { mode: 'backup' } })
  if (error) {
    let detail = 'failed'
    try { const b = await (error as { context?: Response }).context?.json(); detail = b?.error ?? detail } catch { /* ignore */ }
    return { ok: false, detail }
  }
  return { ok: true, sheet_url: (data as { sheet_url?: string })?.sheet_url }
}
