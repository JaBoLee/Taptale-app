import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { sb, ymd, addDays, fmtMoney, fmtDate, fmtDateTime, photoUrl, downloadCsv, loadMembers, type Member } from '../lib/db'
import { LineEditor, emptyLine, fromRows, linesTotal, saveLedgerLines, type Line, type LineRow } from '../components/LineEditor'
import { Button, Card, Empty, Field, Msg, Page, Pill, Row, Seg, inputCls } from '../components/ui'

interface Entry { id: string; entry_date: string; direction: 'income' | 'expense'; amount: number; vat: number | null; has_tax_invoice: boolean | null
  category: string | null; vendor: string | null; description: string | null; source: string; receipt_id: string | null; channel?: 'cash' | 'transfer' | 'owner_cash' | null
  doc_no?: string | null; holder_id?: string | null; cash_movement_id?: string | null }
interface Rcpt { id: string; photo_path: string; supplier_hint: string | null; note: string | null; created_at: string; uploaded_by: string
  kind?: string; vendor?: string | null; doc_no?: string | null; amount?: number | null }

const CATS = ['food', 'beer', 'supplies', 'utilities', 'rent', 'wages', 'transport', 'sales', 'keg_sale', 'other']

function monthRange(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
  return { from: `${m}-01`, to: `${next}-01` }
}

/** จ่ายด้วย: โอน/บัตร หรือ เงินสดที่เจ้าของถือ (เลือกคน) */
function PaidBy({ channel, holder, owners, income, onChange }: { channel: string; holder: string; owners: Member[]; income?: boolean
  onChange: (channel: 'cash' | 'transfer' | 'owner_cash', holder: string) => void }) {
  const { t } = useTranslation()
  const opts = income
    ? [{ value: 'transfer' as const, label: t('acct.ch_in_transfer') }, { value: 'cash' as const, label: t('acct.ch_in_cash') }]
    : [{ value: 'transfer' as const, label: t('acct.ch_transfer') }, { value: 'owner_cash' as const, label: t('acct.ch_owner_cash') }]
  return (
    <>
      <Seg label={income ? t('acct.received_by') : t('acct.channel')} value={channel as 'cash' | 'transfer' | 'owner_cash'} onChange={(v) => onChange(v, holder)} options={opts} />
      {channel === 'owner_cash' && (
        <Field label={t('acct.holder')} hint={t('acct.holder_hint')}>
          <select className={inputCls} value={holder} onChange={(e) => onChange('owner_cash', e.target.value)}>
            <option value="">{t('common.choose')}</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.display_name}</option>)}
          </select>
        </Field>
      )}
    </>
  )
}

function ReceiptReview({ r, owners, onDone }: { r: Rcpt; owners: Member[]; onDone: () => void }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [f, setF] = useState({ vendor: r.vendor ?? r.supplier_hint ?? '', doc_no: r.doc_no ?? '', entry_date: r.created_at.slice(0, 10), amount: r.amount ? String(Number(r.amount)) : '', vat: '', has_tax_invoice: false, category: 'food',
    channel: 'transfer' as 'cash' | 'transfer' | 'owner_cash', holder: '' })
  const [lines, setLines] = useState<Line[]>([])
  const [linked, setLinked] = useState<{ id: string; cash_movement_id: string | null; source?: string } | null | undefined>(undefined)
  const [cands, setCands] = useState<{ id: string; cash_movement_id: string | null; amount: number; entry_date: string; description: string | null; category: string | null }[]>([])
  useEffect(() => {
    // กันลงซ้ำ: ใบเสร็จที่ถ่ายแยก แต่ซื้อด้วยเงินสดจากลิ้นชักที่บันทึกตอนนำเงินออกไปแล้ว
    const d = r.created_at.slice(0, 10)
    sb.from('ledger').select('id, cash_movement_id, amount, entry_date, description, category').eq('source', 'cash_drawer').is('receipt_id', null)
      .gte('entry_date', addDays(d, -2)).lte('entry_date', addDays(d, 1)).order('entry_date', { ascending: false })
      .then(({ data }) => setCands(((data as typeof cands) ?? []).map((c) => ({ ...c, amount: Number(c.amount) }))))
  }, [r.created_at])
  const linkTo = async (id: string) => {
    const c = cands.find((x) => x.id === id)
    if (!c) { setLinked(null); setLines([]); return }
    setLinked({ id: c.id, cash_movement_id: c.cash_movement_id, source: 'cash_drawer' })
    setF((v) => ({ ...v, amount: String(c.amount), category: c.category ?? v.category }))
    if (c.cash_movement_id) {
      const { data: ls } = await sb.from('ledger_lines').select('*').eq('cash_movement_id', c.cash_movement_id).order('sort')
      setLines(ls && ls.length ? fromRows(ls as LineRow[]) : [])
    }
  }
  const [picked, setPicked] = useState('')
  useEffect(() => {
    // ใบเสร็จที่แนบมากับ "นำเงินออกจากลิ้นชัก": มีรายการบัญชีเงินสด + รายการสินค้าที่พนักงานกรอกไว้แล้ว
    // ใบรับของที่พนักงานคีย์ (goods) ระบบลงบัญชีไว้แล้ว + มีรายการสินค้าแล้ว → เจ้าของตรวจ/แก้/เลือกช่องทางจ่าย
    sb.from('ledger').select('id, cash_movement_id, amount, source').eq('receipt_id', r.id).limit(1).then(async ({ data }) => {
      const l = (data as { id: string; cash_movement_id: string | null; amount: number; source: string }[] | null)?.[0] ?? null
      setLinked(l)
      if (l) setF((v) => ({ ...v, amount: String(Number(l.amount)) }))
      const q = l?.cash_movement_id ? sb.from('ledger_lines').select('*').eq('cash_movement_id', l.cash_movement_id) : sb.from('ledger_lines').select('*').eq('receipt_id', r.id)
      const { data: ls } = await q.order('sort')
      if (ls && ls.length) setLines(fromRows(ls as LineRow[]))
    })
  }, [r.id])
  const [busy, setBusy] = useState(false)
  useEffect(() => { photoUrl(r.photo_path).then(setUrl) }, [r.photo_path])

  const post = async () => {
    const amount = Number(f.amount) || linesTotal(lines)
    const fromDrawer = linked?.source === 'cash_drawer'
    if (!amount || (f.channel === 'owner_cash' && !f.holder && !fromDrawer)) return
    setBusy(true)
    const row = { entry_date: f.entry_date, direction: 'expense', amount, vat: f.vat ? Number(f.vat) : null,
      has_tax_invoice: f.has_tax_invoice, category: f.category, vendor: f.vendor || null, doc_no: f.doc_no || null }
    // มีรายการบัญชีเงินสดจากลิ้นชักอยู่แล้ว → แก้รายการเดิม ไม่ลงซ้ำ
    let id = linked?.id ?? null
    let error = null
    if (id) ({ error } = await sb.from('ledger').update(fromDrawer ? row : { ...row, channel: f.channel, holder_id: f.channel === 'owner_cash' ? f.holder : null }).eq('id', id))
    else {
      const res = await sb.from('ledger').insert({ ...row, description: r.note, source: 'receipt', receipt_id: r.id, channel: f.channel,
        holder_id: f.channel === 'owner_cash' ? f.holder : null }).select('id').single()
      error = res.error; id = (res.data as { id: string } | null)?.id ?? null
    }
    if (!error && id && picked) await sb.from('ledger').update({ receipt_id: r.id }).eq('id', id)
    if (!error && id) error = await saveLedgerLines(id, lines, linked?.cash_movement_id, r.id)
    if (!error) await sb.from('receipts').update({ status: 'posted', ocr: { vendor: f.vendor, amount, vat: f.vat ? Number(f.vat) : null } }).eq('id', r.id)
    setBusy(false); onDone()
  }
  const reject = async () => { setBusy(true); await sb.from('receipts').update({ status: 'rejected' }).eq('id', r.id); setBusy(false); onDone() }

  return (
    <div className="flex flex-col gap-2.5 border-t border-line pt-3">
      <span className="text-xs text-muted">{fmtDateTime(r.created_at)}{r.note ? ` · ${r.note}` : ''}</span>
      {url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={t('acct.receipt_photo')} className="max-h-72 w-full rounded-lg object-contain bg-paper" /></a> : <div className="h-40 rounded-lg bg-paper" />}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label={t('acct.vendor')}><input className={inputCls} value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></Field>
        <Field label={t('acct.doc_no')}><input className={inputCls} value={f.doc_no} onChange={(e) => setF({ ...f, doc_no: e.target.value })} /></Field>
        <Field label={t('common.date')}><input type="date" className={inputCls} value={f.entry_date} onChange={(e) => setF({ ...f, entry_date: e.target.value })} /></Field>
        <Field label="VAT"><input className={inputCls} inputMode="decimal" value={f.vat} onChange={(e) => setF({ ...f, vat: e.target.value })} /></Field>
      </div>
      <LineEditor lines={lines} onChange={setLines} />
      <Field label={t('acct.total')} hint={lines.length ? t('acct.total_hint') : undefined}>
        <input className={inputCls} inputMode="decimal" value={f.amount} placeholder={lines.length ? String(linesTotal(lines)) : ''} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      </Field>
      <Field label={t('acct.category')}>
        <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {CATS.map((c) => <option key={c} value={c}>{t(`acct.c_${c}`)}</option>)}
        </select>
      </Field>
      {cands.length > 0 && r.kind !== 'goods' && (linked === null || picked) && (
        <Field label={t('acct.dup_q')}>
          <select className={inputCls} value={picked} onChange={(e) => { setPicked(e.target.value); linkTo(e.target.value) }}>
            <option value="">{t('acct.dup_no')}</option>
            {cands.map((c) => <option key={c.id} value={c.id}>{fmtDate(c.entry_date)} · {c.description || t(`acct.c_${c.category ?? 'other'}`)} · {fmtMoney(c.amount)}</option>)}
          </select>
        </Field>
      )}
      {r.kind === 'goods' && <span className="rounded-xl border-[1.5px] border-line bg-paper px-3 py-2 text-xs font-semibold text-tealink">✓ {t('acct.goods_by_staff')}</span>}
      {linked !== undefined && linked?.source !== 'cash_drawer' && <PaidBy channel={f.channel} holder={f.holder} owners={owners} onChange={(c, h) => setF({ ...f, channel: c, holder: h })} />}
      {linked?.source === 'cash_drawer' && <Pill tone="ok">{t('acct.from_drawer')}</Pill>}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-amberink" checked={f.has_tax_invoice} onChange={(e) => setF({ ...f, has_tax_invoice: e.target.checked })} />{t('acct.tax_invoice')}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={busy} onClick={reject}>{t('acct.reject')}</Button>
        <Button variant="primary" disabled={busy || !(Number(f.amount) || linesTotal(lines)) || (f.channel === 'owner_cash' && !f.holder && linked?.source !== 'cash_drawer')} onClick={post}>{t('acct.post')}</Button>
      </div>
    </div>
  )
}

function EntryDetail({ e, lines, onSaved }: { e: Entry; lines: LineRow[]; onSaved: () => void }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [edit, setEdit] = useState<{ vendor: string; doc_no: string; lines: Line[] } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!e.receipt_id) return
    sb.from('receipts').select('photo_path, drive_url').eq('id', e.receipt_id).maybeSingle().then(async ({ data }) => {
      const r = data as { photo_path: string | null; drive_url: string | null } | null
      setUrl(r?.drive_url ?? (r?.photo_path ? await photoUrl(r.photo_path) : null))
    })
  }, [e.receipt_id])
  const total = lines.reduce((n, l) => n + Number(l.amount), 0)
  const save = async () => {
    if (!edit) return
    setBusy(true)
    await sb.from('ledger').update({ vendor: edit.vendor || null, doc_no: edit.doc_no || null }).eq('id', e.id)
    await saveLedgerLines(e.id, edit.lines, e.cash_movement_id, e.receipt_id)
    setBusy(false); setEdit(null); onSaved()
  }
  if (edit) return (
    <div className="flex flex-col gap-2 rounded-xl bg-paper p-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label={e.direction === 'income' ? t('acct.payer') : t('acct.vendor')}><input className={inputCls} value={edit.vendor} onChange={(x) => setEdit({ ...edit, vendor: x.target.value })} /></Field>
        <Field label={t('acct.doc_no')}><input className={inputCls} value={edit.doc_no} onChange={(x) => setEdit({ ...edit, doc_no: x.target.value })} /></Field>
      </div>
      <LineEditor lines={edit.lines} onChange={(ls) => setEdit({ ...edit, lines: ls })} />
      {edit.lines.length > 0 && Math.abs(linesTotal(edit.lines) - e.amount) > 0.5 && <span className="text-xs text-warn">{t('lines.mismatch', { a: fmtMoney(linesTotal(edit.lines)), b: fmtMoney(e.amount) })}</span>}
      <div className="grid grid-cols-2 gap-2"><Button onClick={() => setEdit(null)}>{t('common.cancel')}</Button><Button variant="primary" disabled={busy} onClick={save}>{t('common.save')}</Button></div>
    </div>
  )
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-paper p-2 text-sm">
      {e.description && <span className="text-muted">{e.description}</span>}
      {lines.map((l, i) => (
        <div key={l.id ?? i} className="flex justify-between gap-2">
          <span className="min-w-0">{l.description}<span className="text-xs text-muted"> · {Number(l.qty)} {l.unit ?? ''} × {fmtMoney(Number(l.unit_price))}</span></span>
          <span className="shrink-0">{fmtMoney(Number(l.amount))}</span>
        </div>
      ))}
      {lines.length > 0 && Math.abs(total - e.amount) > 0.5 && <span className="text-xs text-warn">{t('lines.mismatch', { a: fmtMoney(total), b: fmtMoney(e.amount) })}</span>}
      {lines.length === 0 && <span className="text-xs text-muted">{t('lines.none')}</span>}
      <div className="flex flex-wrap gap-2 pt-1">
        {url && <a href={url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-xl border-[1.5px] border-edge bg-white px-3 text-sm font-semibold">{t('acct.receipt_photo')}</a>}
        <Button small onClick={() => setEdit({ vendor: e.vendor ?? '', doc_no: e.doc_no ?? '', lines: lines.length ? fromRows(lines) : [emptyLine()] })}>{t('lines.edit')}</Button>
      </div>
    </div>
  )
}

/** ไฟล์ Excel ส่งสำนักบัญชี: สรุป · สมุดรายวันรายจ่าย · รายละเอียดสินค้า · สมุดรายวันรายรับ · เงินสดเจ้าของ */
async function exportForAccountant(month: string, entries: Entry[], lines: LineRow[], owners: Member[], t: (k: string, o?: Record<string, unknown>) => string) {
  const rids = entries.map((e) => e.receipt_id).filter(Boolean) as string[]
  const links = new Map<string, string>()
  for (let i = 0; i < rids.length; i += 100) {
    const { data } = await sb.from('receipts').select('id, drive_url').in('id', rids.slice(i, i + 100))
    for (const r of (data as { id: string; drive_url: string | null }[]) ?? []) if (r.drive_url) links.set(r.id, r.drive_url)
  }
  const cat = (c: string | null) => t(`acct.c_${c ?? 'other'}`)
  const ch = (e: Entry) => (e.channel ? t(`acct.ch_${e.channel}`) + (e.channel === 'owner_cash' ? ` (${owners.find((o) => o.id === e.holder_id)?.display_name ?? ''})` : '') : '')
  const linesOf = (e: Entry) => { const own = lines.filter((l) => l.ledger_id === e.id); return own.length ? own : lines.filter((l) => (e.cash_movement_id && l.cash_movement_id === e.cash_movement_id) || (e.receipt_id && l.receipt_id === e.receipt_id)) }
  const asc = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  const exp = asc.filter((e) => e.direction === 'expense'), inc = asc.filter((e) => e.direction === 'income')
  const sum = (xs: Entry[]) => Math.round(xs.reduce((n, e) => n + e.amount, 0) * 100) / 100
  const byCat = (xs: Entry[]) => Object.entries(xs.reduce<Record<string, number>>((a, e) => { a[cat(e.category)] = (a[cat(e.category)] ?? 0) + e.amount; return a }, {}))
  const H = (k: string) => t(`xl.${k}`)

  const summary = [[`${H('title')} ${month}`], [], [H('income_by_cat'), ''], ...byCat(inc).map(([c, v]) => [c, v]), [H('total_income'), sum(inc)], [],
    [H('expense_by_cat'), ''], ...byCat(exp).map(([c, v]) => [c, v]), [H('total_expense'), sum(exp)], [], [H('net'), Math.round((sum(inc) - sum(exp)) * 100) / 100]]
  const expJ = [[H('no'), H('date'), H('doc_no'), H('vendor'), H('desc'), H('category'), H('paid_by'), H('amount'), 'VAT', H('tax_inv'), H('n_items'), H('receipt')],
    ...exp.map((e, i) => [i + 1, e.entry_date, e.doc_no ?? '', e.vendor ?? '', e.description ?? '', cat(e.category), ch(e), e.amount, e.vat ?? '', e.has_tax_invoice ? '✓' : '', linesOf(e).length || '', e.receipt_id ? links.get(e.receipt_id) ?? '' : '']),
    ['', '', '', '', '', '', H('total'), sum(exp)]]
  const det = [[H('date'), H('doc_no'), H('vendor'), H('item'), H('qty'), H('unit'), H('unit_price'), H('amount'), H('category')],
    ...exp.flatMap((e) => linesOf(e).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map((l) => [e.entry_date, e.doc_no ?? '', e.vendor ?? '', l.description, Number(l.qty), l.unit ?? '', Number(l.unit_price), Number(l.amount), cat(e.category)]))]
  const incJ = [[H('no'), H('date'), H('doc_no'), H('payer'), H('desc'), H('category'), H('received_by'), H('amount'), H('source')],
    ...inc.map((e, i) => [i + 1, e.entry_date, e.doc_no ?? '', e.vendor ?? '', e.description ?? '', cat(e.category), ch(e), e.amount, t(`acct.s_${e.source}`)]),
    ['', '', '', '', '', '', H('total'), sum(inc)]]
  const wb = XLSX.utils.book_new()
  const add = (name: string, aoa: unknown[][], widths: number[]) => { const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = widths.map((w) => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name) }
  add(H('s_summary'), summary, [28, 14])
  add(H('s_expense'), expJ, [5, 11, 12, 22, 24, 14, 18, 12, 9, 8, 8, 40])
  add(H('s_items'), det, [11, 12, 22, 30, 8, 8, 11, 12, 14])
  add(H('s_income'), incJ, [5, 11, 12, 20, 24, 14, 16, 12, 10])
  XLSX.writeFile(wb, `TapTale-บัญชี-${month}.xlsx`)
}

interface CClose { id: string; work_date: string; cash_open: number | null; cash_close: number | null; closed_at: string }
interface CMove { id: string; direction: 'in' | 'out'; amount: number; reason: string; note: string | null; created_at: string; holder_id?: string | null }
interface OMove { id: string; holder_id: string; direction: 'in' | 'out'; amount: number; reason: string; note: string | null; move_date: string }

/** เงินสดที่เจ้าของแต่ละคนถืออยู่ = นำไปเก็บจากลิ้นชัก − คืนเข้าลิ้นชัก − จ่ายค่าของด้วยเงินนี้ − ฝากธนาคาร ± ปรับยอด */
function OwnerCash({ owners }: { owners: Member[] }) {
  const { t } = useTranslation()
  const [d, setD] = useState<{ mv: CMove[]; paid: { holder_id: string; amount: number; entry_date: string; vendor: string | null }[]; om: OMove[] } | null>(null)
  const [f, setF] = useState({ holder: '', kind: 'deposit' as 'deposit' | 'adjust_in' | 'adjust_out', amount: '', note: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      sb.from('cash_movements').select('id, direction, amount, reason, note, created_at, holder_id').not('holder_id', 'is', null),
      sb.from('ledger').select('holder_id, amount, entry_date, vendor').eq('channel', 'owner_cash').eq('direction', 'expense'),
      sb.from('owner_cash_moves').select('*').order('move_date'),
    ])
    if (c.error) { setD({ mv: [], paid: [], om: [] }); return }
    setD({ mv: (a.data as CMove[]) ?? [], paid: (b.data as { holder_id: string; amount: number; entry_date: string; vendor: string | null }[]) ?? [], om: (c.data as OMove[]) ?? [] })
  }, [])
  useEffect(() => { load() }, [load])
  if (!d) return null
  const bal = (id: string) =>
    d.mv.filter((m) => m.holder_id === id).reduce((n, m) => n + (m.direction === 'out' ? 1 : -1) * Number(m.amount), 0)
    - d.paid.filter((p) => p.holder_id === id).reduce((n, p) => n + Number(p.amount), 0)
    + d.om.filter((o) => o.holder_id === id).reduce((n, o) => n + (o.direction === 'in' ? 1 : -1) * Number(o.amount), 0)
  const add = async () => {
    if (!f.holder || !Number(f.amount)) return
    const { error } = await sb.from('owner_cash_moves').insert({ holder_id: f.holder, direction: f.kind === 'adjust_in' ? 'in' : 'out', amount: Number(f.amount),
      reason: f.kind === 'deposit' ? 'deposit' : 'adjust', note: f.note || null })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('common.saved') })
    if (!error) { setF({ ...f, amount: '', note: '' }); load() }
  }
  return (
    <Card>
      <span className="text-[15px] font-semibold">{t('acct.owner_cash')}</span>
      <span className="text-xs text-muted">{t('acct.owner_cash_hint')}</span>
      {owners.map((o) => <Row key={o.id}><span>{o.display_name}</span><b className={bal(o.id) < 0 ? 'text-bad' : ''}>{fmtMoney(bal(o.id))}</b></Row>)}
      <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-dashed border-edge p-3">
        <Seg label={t('acct.oc_kind')} value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={[
          { value: 'deposit', label: t('acct.oc_deposit') }, { value: 'adjust_in', label: t('acct.oc_adj_in') }, { value: 'adjust_out', label: t('acct.oc_adj_out') }]} />
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('acct.holder')}><select className={inputCls} value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })}>
            <option value="">{t('common.choose')}</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.display_name}</option>)}</select></Field>
          <Field label={t('common.amount')}><input className={inputCls} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        </div>
        <Field label={t('common.note')}><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <Msg msg={msg} />
        <Button disabled={!f.holder || !Number(f.amount)} onClick={add}>{t('common.save')}</Button>
        <span className="text-xs text-muted">{t('acct.oc_pay_hint')}</span>
      </div>
    </Card>
  )
}

function CashTab({ month, owners }: { month: string; owners: Member[] }) {
  const { t } = useTranslation()
  const [data, setData] = useState<{ closes: CClose[]; moves: CMove[] } | null>(null)
  useEffect(() => {
    const { from, to } = monthRange(month)
    setData(null)
    Promise.all([
      sb.from('shift_closes').select('id, work_date, cash_open, cash_close, closed_at').gte('closed_at', addDays(from, -3) + 'T00:00:00+07:00').lt('closed_at', to + 'T00:00:00+07:00').order('closed_at'),
      sb.from('cash_movements').select('*').gte('created_at', addDays(from, -3) + 'T00:00:00+07:00').lt('created_at', to + 'T00:00:00+07:00').order('created_at'),
    ]).then(([c, m]) => setData({ closes: (c.data as CClose[]) ?? [], moves: ((m.data as CMove[]) ?? []).map((x) => ({ ...x, amount: Number(x.amount) })) }))
  }, [month])
  if (!data) return <Card><Empty>…</Empty></Card>
  const { from } = monthRange(month)
  const inMonth = (iso: string) => ymd(new Date(iso)) >= from
  const day = (iso: string) => ymd(new Date(iso))
  const byDay: Record<string, { s: number; e: number; k: number }> = {}
  const bump = (d: string, k: 's' | 'e' | 'k', v: number) => { byDay[d] = byDay[d] ?? { s: 0, e: 0, k: 0 }; byDay[d][k] += v }
  // ขายได้เงินสดต่อกะ = ปิด − เปิด + นำออก − นำเข้า (รายการระหว่างปิดกะก่อนหน้า ถึงปิดกะนี้)
  let sales = 0
  data.closes.forEach((c, i) => {
    if (!inMonth(c.closed_at) || c.cash_open == null || c.cash_close == null) return
    const after = i > 0 ? data.closes[i - 1].closed_at : new Date(new Date(c.closed_at).getTime() - 864e5).toISOString()
    const mv = data.moves.filter((m) => m.created_at > after && m.created_at <= c.closed_at)
    const v = Number(c.cash_close) - Number(c.cash_open) + mv.reduce((n, m) => n + (m.direction === 'out' ? m.amount : -m.amount), 0)
    sales += v; bump(c.work_date, 's', v)
  })
  const ms = data.moves.filter((m) => inMonth(m.created_at))
  const spent = ms.filter((m) => m.direction === 'out' && ['fresh_food', 'delivery', 'other'].includes(m.reason))
  const kept = ms.filter((m) => m.direction === 'out' && m.reason === 'safekeep')
  const float = ms.filter((m) => m.reason === 'change' || (m.direction === 'in' && m.reason === 'other')).reduce((n, m) => n + (m.direction === 'in' ? m.amount : -m.amount), 0)
  spent.forEach((m) => bump(day(m.created_at), 'e', m.amount)); kept.forEach((m) => bump(day(m.created_at), 'k', m.amount))
  const sum = (xs: CMove[]) => xs.reduce((n, m) => n + m.amount, 0)
  const last = [...data.closes].reverse().find((c) => c.cash_close != null)
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.cash_sales')}</span><b className="text-ok">{fmtMoney(sales)}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.cash_spent')}</span><b className="text-bad">{fmtMoney(sum(spent))}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.cash_kept')}</span><b>{fmtMoney(sum(kept))}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.cash_float')}</span><b>{fmtMoney(float)}</b></Card>
      </div>
      <Card tone="dark"><Row><span className="text-herosub">{t('acct.cash_drawer_now')}</span><b className="text-amber">{last ? fmtMoney(Number(last.cash_close)) : '–'}</b></Row>
        <span className="text-xs text-herosub">{t('acct.cash_hint')}</span></Card>
      <Card>
        <span className="text-[15px] font-semibold">{t('acct.cash_days')}</span>
        {Object.keys(byDay).length === 0 && <Empty>{t('common.none')}</Empty>}
        {Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([d, v]) => (
          <Row key={d}><span>{fmtDate(d)}</span><span className="text-right text-sm">{t('acct.cash_day_row', { s: fmtMoney(v.s), e: fmtMoney(v.e), k: fmtMoney(v.k) })}</span></Row>
        ))}
      </Card>
      {kept.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('acct.cash_kept_list')}</span>
          {kept.slice().reverse().map((m) => <Row key={m.id}><span className="flex flex-col"><span>{owners.find((o) => o.id === m.holder_id)?.display_name ?? m.note ?? '–'}</span><span className="text-xs text-muted">{fmtDateTime(m.created_at)}</span></span><b>{fmtMoney(m.amount)}</b></Row>)}
        </Card>
      )}
      <OwnerCash owners={owners} />
      {spent.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('acct.cash_spent_list')}</span>
          {spent.slice().reverse().map((m) => <Row key={m.id}><span className="flex flex-col"><span>{t(`close.r_${m.reason}`)}{m.note ? ` · ${m.note}` : ''}</span><span className="text-xs text-muted">{fmtDateTime(m.created_at)}</span></span><b className="text-bad">−{fmtMoney(m.amount)}</b></Row>)}
        </Card>
      )}
    </>
  )
}

export default function Accounting() {
  const { t } = useTranslation()
  const [month, setMonth] = useState(ymd().slice(0, 7))
  const [entries, setEntries] = useState<Entry[]>([])
  const [pending, setPending] = useState<Rcpt[]>([])
  const [tab, setTab] = useState<'review' | 'manual' | 'pos' | 'cash'>('review')
  const [mf, setMf] = useState({ entry_date: ymd(), direction: 'expense' as 'income' | 'expense', amount: '', vat: '', category: 'other', vendor: '', description: '', doc_no: '',
    channel: 'transfer' as 'cash' | 'transfer' | 'owner_cash', holder: '' })
  const [mLines, setMLines] = useState<Line[]>([])
  const [owners, setOwners] = useState<Member[]>([])
  const [lines, setLines] = useState<LineRow[]>([])
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => { loadMembers().then((ms) => setOwners(ms.filter((x) => x.role === 'owner'))) }, [])
  const [pos, setPos] = useState<{ cols: string[]; rows: Record<string, unknown>[]; dateCol: string; amountCol: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    const { from, to } = monthRange(month)
    const [{ data: e }, { data: p }] = await Promise.all([
      sb.from('ledger').select('*').gte('entry_date', from).lt('entry_date', to).order('entry_date', { ascending: false }),
      sb.from('receipts').select('*').eq('status', 'pending').order('created_at'),
    ])
    const es = ((e as Entry[]) ?? []).map((x) => ({ ...x, amount: Number(x.amount) }))
    setEntries(es)
    setPending((p as Rcpt[]) ?? [])
    // รายการสินค้าของรายการบัญชีเดือนนี้ (ของรายการบัญชีเอง + ที่พนักงานกรอกตอนนำเงินออก)
    const ids = es.map((x) => x.id), mids = es.map((x) => x.cash_movement_id).filter(Boolean) as string[], rids = es.map((x) => x.receipt_id).filter(Boolean) as string[]
    const chunks = <T,>(xs: T[]) => Array.from({ length: Math.ceil(xs.length / 100) }, (_, i) => xs.slice(i * 100, i * 100 + 100))
    const res = await Promise.all([
      ...chunks(ids).map((c) => sb.from('ledger_lines').select('*').in('ledger_id', c)),
      ...chunks(mids).map((c) => sb.from('ledger_lines').select('*').in('cash_movement_id', c)),
      ...chunks(rids).map((c) => sb.from('ledger_lines').select('*').in('receipt_id', c)),
    ])
    setLines([...new Map(res.flatMap((r) => (r.data as LineRow[]) ?? []).map((l) => [l.id, l])).values()])
  }, [month])
  useEffect(() => { load() }, [load])

  const income = entries.filter((e) => e.direction === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter((e) => e.direction === 'expense').reduce((s, e) => s + e.amount, 0)

  const linesOf = (e: Entry) => {
    const own = lines.filter((l) => l.ledger_id === e.id)
    return (own.length ? own : lines.filter((l) => (e.cash_movement_id && l.cash_movement_id === e.cash_movement_id) || (e.receipt_id && l.receipt_id === e.receipt_id))).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  }
  const ownerName = (id: string | null | undefined) => owners.find((o) => o.id === id)?.display_name ?? ''
  const manualOk = !!(Number(mf.amount) || linesTotal(mLines)) && !(mf.channel === 'owner_cash' && !mf.holder)
  const addManual = async () => {
    if (!manualOk) return
    setBusy(true)
    const { data: ins, error } = await sb.from('ledger').insert({ entry_date: mf.entry_date, direction: mf.direction, amount: Number(mf.amount) || linesTotal(mLines), vat: mf.vat ? Number(mf.vat) : null,
      category: mf.category, vendor: mf.vendor || null, description: mf.description || null, doc_no: mf.doc_no || null, source: 'manual', channel: mf.channel,
      holder_id: mf.channel === 'owner_cash' ? mf.holder : null }).select('id').single()
    const le = !error && ins ? await saveLedgerLines((ins as { id: string }).id, mLines) : null
    setMsg(error || le ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('common.saved') })
    if (!error) { setMf({ ...mf, amount: '', vat: '', vendor: '', description: '', doc_no: '' }); setMLines([]); load() }
    setBusy(false)
  }

  const readPos = async (file: File | null) => {
    if (!file) return
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }) as Record<string, unknown>[]
    const cols = rows.length ? Object.keys(rows[0]) : []
    const guess = (re: RegExp) => cols.find((c) => re.test(c)) ?? ''
    setPos({ cols, rows, dateCol: guess(/date|วันที่|เวลา|time/i), amountCol: guess(/net|total|amount|ยอด|รวม|sales/i) })
  }

  const toYmd = (v: unknown): string | null => {
    if (v instanceof Date) return ymd(v)
    const s = String(v ?? '').trim()
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
    if (m) { let y = Number(m[3]); if (y < 100) y += 2000; if (y > 2400) y -= 543; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }
    return null
  }
  const posDaily = pos && pos.dateCol && pos.amountCol
    ? Object.entries(pos.rows.reduce<Record<string, number>>((acc, r) => {
        const d = toYmd(r[pos.dateCol]); const a = Number(String(r[pos.amountCol]).replace(/[^\d.-]/g, ''))
        if (d && !Number.isNaN(a)) acc[d] = (acc[d] ?? 0) + a
        return acc
      }, {})).sort()
    : []

  const importPos = async () => {
    if (!posDaily.length) return
    setBusy(true)
    const dates = posDaily.map(([d]) => d)
    await sb.from('ledger').delete().eq('source', 'pos').in('entry_date', dates)
    const { error } = await sb.from('ledger').insert(posDaily.map(([d, a]) => ({ entry_date: d, direction: 'income', amount: Math.round(a * 100) / 100, category: 'sales', source: 'pos', description: 'POS' })))
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('acct.pos_done', { n: posDaily.length }) })
    if (!error) { setPos(null); load() }
    setBusy(false)
  }

  const exportAccountant = () => exportForAccountant(month, entries, lines, owners, t)
  const exportCsv = () => downloadCsv(`taptale-ledger-${month}.csv`, [
    ['date', 'type', 'amount', 'vat', 'tax_invoice', 'category', 'vendor', 'description', 'source', 'channel'],
    ...entries.map((e) => [e.entry_date, e.direction, e.amount, e.vat, e.has_tax_invoice ? 'yes' : '', e.category, e.vendor, e.description, e.source, e.channel ?? '']),
  ])

  return (
    <Page title={t('acct.title')} back="/owner" right={<input type="month" aria-label={t('acct.month')} className="h-10 rounded-lg border border-line bg-white px-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} />}>
      <div className="grid grid-cols-3 gap-2">
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.income')}</span><b>{fmtMoney(income)}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.expense')}</span><b>{fmtMoney(expense)}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.net')}</span><b className={income - expense >= 0 ? 'text-ok' : 'text-bad'}>{fmtMoney(income - expense)}</b></Card>
      </div>
      <Seg label={t('acct.mode')} value={tab} onChange={setTab} options={[
        { value: 'review', label: `${t('acct.review')}${pending.length ? ` (${pending.length})` : ''}` }, { value: 'manual', label: t('acct.manual') }, { value: 'pos', label: t('acct.pos') }, { value: 'cash', label: t('acct.cash') }]} />
      <Msg msg={msg} />

      {tab === 'review' && (
        <Card>
          <span className="text-[15px] font-semibold">{t('acct.pending')}</span>
          <span className="text-xs text-muted">{t('acct.ai_note')}</span>
          {pending.length === 0 && <Empty>{t('acct.no_pending')}</Empty>}
          {pending.map((r) => <ReceiptReview key={r.id} r={r} owners={owners} onDone={load} />)}
        </Card>
      )}

      {tab === 'manual' && (
        <Card>
          <Seg label={t('acct.type')} value={mf.direction} onChange={(v) => setMf({ ...mf, direction: v, channel: 'transfer', holder: '' })} options={[{ value: 'expense', label: t('acct.expense') }, { value: 'income', label: t('acct.income') }]} />
          <PaidBy channel={mf.channel} holder={mf.holder} owners={owners} income={mf.direction === 'income'} onChange={(c, h) => setMf({ ...mf, channel: c, holder: h })} />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t('common.date')}><input type="date" className={inputCls} value={mf.entry_date} onChange={(e) => setMf({ ...mf, entry_date: e.target.value })} /></Field>
            <Field label={t('common.amount')}><input className={inputCls} inputMode="decimal" value={mf.amount} placeholder={mLines.length ? String(linesTotal(mLines)) : ''} onChange={(e) => setMf({ ...mf, amount: e.target.value })} /></Field>
            <Field label={t('acct.category')}>
              <select className={inputCls} value={mf.category} onChange={(e) => setMf({ ...mf, category: e.target.value })}>{CATS.map((c) => <option key={c} value={c}>{t(`acct.c_${c}`)}</option>)}</select>
            </Field>
            <Field label="VAT"><input className={inputCls} inputMode="decimal" value={mf.vat} onChange={(e) => setMf({ ...mf, vat: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={mf.direction === 'income' ? t('acct.payer') : t('acct.vendor')}><input className={inputCls} value={mf.vendor} onChange={(e) => setMf({ ...mf, vendor: e.target.value })} /></Field>
            <Field label={t('acct.doc_no')}><input className={inputCls} value={mf.doc_no} onChange={(e) => setMf({ ...mf, doc_no: e.target.value })} /></Field>
          </div>
          <Field label={t('common.note')}><input className={inputCls} value={mf.description} onChange={(e) => setMf({ ...mf, description: e.target.value })} /></Field>
          <LineEditor lines={mLines} onChange={setMLines} />
          <Button variant="primary" disabled={busy || !manualOk} onClick={addManual}>{t('common.save')}</Button>
        </Card>
      )}

      {tab === 'cash' && <CashTab month={month} owners={owners} />}

      {tab === 'pos' && (
        <Card>
          <span className="text-xs text-muted">{t('acct.pos_hint')}</span>
          <input type="file" accept=".csv,.xlsx,.xls" className="text-sm" onChange={(e) => readPos(e.target.files?.[0] ?? null)} />
          {pos && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={t('acct.date_col')}><select className={inputCls} value={pos.dateCol} onChange={(e) => setPos({ ...pos, dateCol: e.target.value })}><option value="">–</option>{pos.cols.map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label={t('acct.amount_col')}><select className={inputCls} value={pos.amountCol} onChange={(e) => setPos({ ...pos, amountCol: e.target.value })}><option value="">–</option>{pos.cols.map((c) => <option key={c}>{c}</option>)}</select></Field>
              </div>
              {posDaily.map(([d, a]) => <Row key={d}><span>{fmtDate(d)}</span><span>{fmtMoney(a)}</span></Row>)}
              {pos.rows.length > 0 && !posDaily.length && <span className="text-sm text-bad">{t('acct.pos_bad')}</span>}
              <Button variant="primary" disabled={busy || !posDaily.length} onClick={importPos}>{t('acct.pos_import', { n: posDaily.length })}</Button>
              <span className="text-xs text-muted">{t('acct.pos_replace')}</span>
            </>
          )}
        </Card>
      )}

      <Card>
        <Row><span className="text-[15px] font-semibold">{t('acct.entries')}</span><span className="flex gap-1.5"><Button small onClick={exportCsv}>CSV</Button><Button small variant="primary" onClick={exportAccountant}>{t('acct.export_acc')}</Button></span></Row>
        {entries.length === 0 && <Empty>{t('common.none')}</Empty>}
        {entries.map((e) => {
          const ls = linesOf(e)
          return (
            <div key={e.id} className="flex flex-col gap-1.5 border-b border-line pb-2 last:border-0">
              <button type="button" className="flex min-h-11 w-full items-center justify-between gap-2 text-left" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{e.vendor || e.description || t(`acct.c_${e.category ?? 'other'}`)}{e.doc_no ? ` · #${e.doc_no}` : ''}</span>
                  <span className="text-xs text-muted">{fmtDate(e.entry_date)} · {t(`acct.c_${e.category ?? 'other'}`)} · {t(`acct.s_${e.source}`)}{e.channel ? ` · ${t(`acct.ch_${e.channel}`)}${e.channel === 'owner_cash' ? ` (${ownerName(e.holder_id)})` : ''}` : ''}{ls.length ? ` · ${t('lines.n_items', { n: ls.length })}` : ''}</span>
                </span>
                <span className={`shrink-0 ${e.direction === 'income' ? 'text-ok' : ''}`}>{e.direction === 'income' ? '+' : '−'}{fmtMoney(e.amount)}</span>
              </button>
              {open === e.id && <EntryDetail e={e} lines={ls} onSaved={load} />}
            </div>
          )
        })}
      </Card>
      <Pill>{t('acct.drive_note')}</Pill>
    </Page>
  )
}
