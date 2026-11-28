import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sb, fmtMoney } from '../lib/db'
import { inputCls } from './ui'

/** รายการสินค้าในใบเสร็จ: พิมพ์ชื่อหรือเลือกจากรายการสินค้าของร้าน (ชื่อที่ร้านเรียก + ชื่อสินค้าที่ supplier) */
export interface Line { item_id: string | null; description: string; qty: string; unit: string; unit_price: string
  to_stock?: boolean; stock_qty?: string; pack?: number; stock_edited?: boolean; stock_event_id?: string | null }
export interface LineRow { id?: string; item_id: string | null; description: string; qty: number; unit: string | null; unit_price: number; amount: number; sort?: number
  ledger_id?: string | null; cash_movement_id?: string | null; receipt_id?: string | null; stock_qty?: number | null; stock_event_id?: string | null }

export const emptyLine = (): Line => ({ item_id: null, description: '', qty: '1', unit: '', unit_price: '' })
export const lineAmount = (l: Line) => Math.round((Number(l.qty) || 0) * (Number(l.unit_price) || 0) * 100) / 100
export const validLines = (ls: Line[]) => ls.filter((l) => l.description.trim() && Number(l.qty) > 0)
export const linesTotal = (ls: Line[]) => validLines(ls).reduce((n, l) => n + lineAmount(l), 0)
export const fromRows = (rs: LineRow[]): Line[] => rs.map((r) => ({ item_id: r.item_id, description: r.description, qty: String(Number(r.qty)), unit: r.unit ?? '',
  unit_price: String(Number(r.unit_price)), stock_qty: r.stock_qty != null ? String(Number(r.stock_qty)) : '', stock_event_id: r.stock_event_id ?? null, to_stock: false }))
export const toRows = (ls: Line[], link: { ledger_id?: string; cash_movement_id?: string; receipt_id?: string }) =>
  validLines(ls).map((l, i) => ({ ...link, item_id: l.item_id, description: l.description.trim(), qty: Number(l.qty), unit: l.unit.trim() || null,
    unit_price: Number(l.unit_price) || 0, amount: lineAmount(l), sort: i,
    to_stock: !!(l.to_stock && l.item_id && !l.stock_event_id && Number(l.stock_qty) > 0),
    stock_qty: l.item_id && Number(l.stock_qty) > 0 ? Number(l.stock_qty) : null, stock_event_id: l.stock_event_id ?? null }))

/** บันทึกรายการสินค้าของรายการบัญชี (ลบของเดิมที่ผูกกับรายการนี้แล้วใส่ใหม่) */
export async function saveLedgerLines(ledgerId: string, ls: Line[], cashMoveId?: string | null, receiptId?: string | null) {
  await sb.from('ledger_lines').delete().eq('ledger_id', ledgerId)
  if (cashMoveId) await sb.from('ledger_lines').delete().eq('cash_movement_id', cashMoveId)
  if (receiptId) await sb.from('ledger_lines').delete().eq('receipt_id', receiptId)
  const rows = toRows(ls, { ledger_id: ledgerId })
  if (!rows.length) return null
  const { error } = await sb.from('ledger_lines').insert(rows)
  return error
}

interface Opt { label: string; item_id: string; unit: string; name: string; pack: number }
let cache: Promise<Opt[]> | null = null
let seq = 0
export function loadItemOptions(): Promise<Opt[]> {
  if (!cache) cache = (async () => {
    const [{ data: items }, { data: prods }] = await Promise.all([
      sb.from('items').select('id, name_th, count_unit').eq('active', true).order('name_th'),
      sb.from('supplier_products').select('item_id, product_name, pack_qty'),
    ])
    const it = (items as { id: string; name_th: string; count_unit: string }[]) ?? []
    const byId = new Map(it.map((i) => [i.id, i]))
    const out: Opt[] = it.map((i) => ({ label: i.name_th, item_id: i.id, unit: i.count_unit, name: i.name_th, pack: 1 }))
    for (const p of (prods as { item_id: string; product_name: string; pack_qty: number | null }[]) ?? []) {
      const i = byId.get(p.item_id)
      if (i && p.product_name && !out.some((o) => o.label === p.product_name)) out.push({ label: p.product_name, item_id: i.id, unit: i.count_unit, name: i.name_th, pack: Number(p.pack_qty) || 1 })
    }
    return out
  })()
  return cache
}

/** stockDefault: ติ๊ก "รับเข้าสต๊อก" ไว้ก่อนหรือไม่ (พนักงานซื้อของตลาด = ติ๊ก, ใบเสร็จที่เจ้าของลง = ไม่ติ๊ก กันรับซ้ำกับปุ่มรับของ) */
export function LineEditor({ lines, onChange, stockDefault = false }: { lines: Line[]; onChange: (ls: Line[]) => void; stockDefault?: boolean }) {
  const { t } = useTranslation()
  const [listId] = useState(() => `items-list-${++seq}`)
  const [opts, setOpts] = useState<Opt[]>([])
  useEffect(() => { loadItemOptions().then(setOpts) }, [])
  // จำนวนเข้าสต๊อก = จำนวนที่ซื้อ × ขนาดแพ็ก (ชื่อสินค้า supplier) แก้เองได้
  const auto = (l: Line) => (l.stock_edited ? l : { ...l, stock_qty: l.item_id ? String(Math.round((Number(l.qty) || 0) * (l.pack ?? 1) * 1000) / 1000) : '' })
  const set = (i: number, patch: Partial<Line>) => onChange(lines.map((l, j) => (j === i ? auto({ ...l, ...patch }) : l)))
  const pick = (i: number, text: string) => {
    const o = opts.find((x) => x.label === text)
    set(i, o ? { description: text, item_id: o.item_id, unit: lines[i].unit || o.unit, pack: o.pack, to_stock: lines[i].to_stock ?? stockDefault }
      : { description: text, item_id: null, to_stock: false })
  }
  const nameOf = (id: string | null) => (id ? opts.find((o) => o.item_id === id)?.name : undefined)
  const unitOf = (id: string | null) => (id ? opts.find((o) => o.item_id === id && o.pack === 1)?.unit ?? opts.find((o) => o.item_id === id)?.unit : '')

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold">{t('lines.title')}</span>
      <span className="text-xs text-muted">{t('lines.hint')}</span>
      {lines.some((l) => l.to_stock && l.item_id && !l.stock_event_id) && <span className="text-xs font-semibold text-tealink">{t('lines.stock_note')}</span>}
      <datalist id={listId}>{opts.map((o) => <option key={o.label} value={o.label} />)}</datalist>
      {lines.map((l, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-xl border-[1.5px] border-line bg-paper p-2">
          <div className="flex items-center gap-1.5">
            <input className={inputCls} list={listId} placeholder={t('lines.desc')} aria-label={t('lines.desc')} value={l.description} onChange={(e) => pick(i, e.target.value)} />
            <button type="button" aria-label={t('common.delete')} className="flex h-11 w-11 shrink-0 items-center justify-center text-bad" onClick={() => onChange(lines.filter((_, j) => j !== i))}>✕</button>
          </div>
          {l.item_id && nameOf(l.item_id) !== l.description && <span className="text-xs text-tealink">✓ {t('lines.matched', { name: nameOf(l.item_id) })}</span>}
          {l.description.trim() && !l.item_id && <span className="text-xs text-muted">{t('lines.unmatched')}</span>}
          <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-1.5">
            <input className={inputCls} inputMode="decimal" placeholder={t('lines.qty')} aria-label={t('lines.qty')} value={l.qty} onChange={(e) => set(i, { qty: e.target.value })} />
            <input className={inputCls} placeholder={t('lines.unit')} aria-label={t('lines.unit')} value={l.unit} onChange={(e) => set(i, { unit: e.target.value })} />
            <input className={inputCls} inputMode="decimal" placeholder={t('lines.price')} aria-label={t('lines.price')} value={l.unit_price} onChange={(e) => set(i, { unit_price: e.target.value })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            {l.item_id && l.stock_event_id && <span className="text-xs text-tealink">✓ {t('lines.in_stock', { n: Number(l.stock_qty) || '', u: unitOf(l.item_id) })}</span>}
            {l.item_id && !l.stock_event_id && (
              <label className="flex min-h-11 items-center gap-1.5 text-xs">
                <input type="checkbox" className="h-5 w-5 accent-amberink" checked={!!l.to_stock} onChange={(e) => set(i, { to_stock: e.target.checked })} />
                {t('lines.to_stock')}
                {l.to_stock && <input className="h-9 w-16 rounded-lg border-[1.5px] border-edge bg-white px-1.5 text-right text-sm" inputMode="decimal" aria-label={t('lines.stock_qty')}
                  value={l.stock_qty ?? ''} onChange={(e) => set(i, { stock_qty: e.target.value, stock_edited: true })} />}
                {l.to_stock && <span>{unitOf(l.item_id)}</span>}
              </label>
            )}
            {!l.item_id && <span />}
            <span className="text-sm font-semibold">{fmtMoney(lineAmount(l))}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="min-h-11 rounded-xl border-[1.5px] border-tealink px-4 text-sm font-semibold text-tealink" onClick={() => onChange([...lines, { ...emptyLine(), to_stock: stockDefault }])}>{t('lines.add')}</button>
        {lines.length > 0 && <span className="text-sm">{t('lines.total')} <b>{fmtMoney(linesTotal(lines))}</b></span>}
      </div>
    </div>
  )
}
