import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { sb, ymd, fmtMoney, fmtDate, fmtDateTime, photoUrl, downloadCsv } from '../lib/db'
import { Button, Card, Empty, Field, Msg, Page, Pill, Row, Seg, inputCls } from '../components/ui'

interface Entry { id: string; entry_date: string; direction: 'income' | 'expense'; amount: number; vat: number | null; has_tax_invoice: boolean | null
  category: string | null; vendor: string | null; description: string | null; source: string; receipt_id: string | null }
interface Rcpt { id: string; photo_path: string; supplier_hint: string | null; note: string | null; created_at: string; uploaded_by: string }

const CATS = ['food', 'beer', 'supplies', 'utilities', 'rent', 'wages', 'transport', 'sales', 'keg_sale', 'other']

function monthRange(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
  return { from: `${m}-01`, to: `${next}-01` }
}

function ReceiptReview({ r, onDone }: { r: Rcpt; onDone: () => void }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [f, setF] = useState({ vendor: r.supplier_hint ?? '', entry_date: r.created_at.slice(0, 10), amount: '', vat: '', has_tax_invoice: false, category: 'food' })
  const [busy, setBusy] = useState(false)
  useEffect(() => { photoUrl(r.photo_path).then(setUrl) }, [r.photo_path])

  const post = async () => {
    if (!Number(f.amount)) return
    setBusy(true)
    const { error } = await sb.from('ledger').insert({ entry_date: f.entry_date, direction: 'expense', amount: Number(f.amount), vat: f.vat ? Number(f.vat) : null,
      has_tax_invoice: f.has_tax_invoice, category: f.category, vendor: f.vendor || null, description: r.note, source: 'receipt', receipt_id: r.id })
    if (!error) await sb.from('receipts').update({ status: 'posted', ocr: { vendor: f.vendor, amount: Number(f.amount), vat: f.vat ? Number(f.vat) : null } }).eq('id', r.id)
    setBusy(false); onDone()
  }
  const reject = async () => { setBusy(true); await sb.from('receipts').update({ status: 'rejected' }).eq('id', r.id); setBusy(false); onDone() }

  return (
    <div className="flex flex-col gap-2.5 border-t border-line pt-3">
      <span className="text-xs text-muted">{fmtDateTime(r.created_at)}{r.note ? ` · ${r.note}` : ''}</span>
      {url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={t('acct.receipt_photo')} className="max-h-72 w-full rounded-lg object-contain bg-paper" /></a> : <div className="h-40 rounded-lg bg-paper" />}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label={t('acct.vendor')}><input className={inputCls} value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></Field>
        <Field label={t('common.date')}><input type="date" className={inputCls} value={f.entry_date} onChange={(e) => setF({ ...f, entry_date: e.target.value })} /></Field>
        <Field label={t('acct.total')}><input className={inputCls} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="VAT"><input className={inputCls} inputMode="decimal" value={f.vat} onChange={(e) => setF({ ...f, vat: e.target.value })} /></Field>
      </div>
      <Field label={t('acct.category')}>
        <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {CATS.map((c) => <option key={c} value={c}>{t(`acct.c_${c}`)}</option>)}
        </select>
      </Field>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-amberink" checked={f.has_tax_invoice} onChange={(e) => setF({ ...f, has_tax_invoice: e.target.checked })} />{t('acct.tax_invoice')}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={busy} onClick={reject}>{t('acct.reject')}</Button>
        <Button variant="primary" disabled={busy || !Number(f.amount)} onClick={post}>{t('acct.post')}</Button>
      </div>
    </div>
  )
}

export default function Accounting() {
  const { t } = useTranslation()
  const [month, setMonth] = useState(ymd().slice(0, 7))
  const [entries, setEntries] = useState<Entry[]>([])
  const [pending, setPending] = useState<Rcpt[]>([])
  const [tab, setTab] = useState<'review' | 'manual' | 'pos'>('review')
  const [mf, setMf] = useState({ entry_date: ymd(), direction: 'expense' as 'income' | 'expense', amount: '', vat: '', category: 'other', vendor: '', description: '' })
  const [pos, setPos] = useState<{ cols: string[]; rows: Record<string, unknown>[]; dateCol: string; amountCol: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    const { from, to } = monthRange(month)
    const [{ data: e }, { data: p }] = await Promise.all([
      sb.from('ledger').select('*').gte('entry_date', from).lt('entry_date', to).order('entry_date', { ascending: false }),
      sb.from('receipts').select('id, photo_path, supplier_hint, note, created_at, uploaded_by').eq('status', 'pending').order('created_at'),
    ])
    setEntries(((e as Entry[]) ?? []).map((x) => ({ ...x, amount: Number(x.amount) })))
    setPending((p as Rcpt[]) ?? [])
  }, [month])
  useEffect(() => { load() }, [load])

  const income = entries.filter((e) => e.direction === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter((e) => e.direction === 'expense').reduce((s, e) => s + e.amount, 0)

  const addManual = async () => {
    if (!Number(mf.amount)) return
    setBusy(true)
    const { error } = await sb.from('ledger').insert({ entry_date: mf.entry_date, direction: mf.direction, amount: Number(mf.amount), vat: mf.vat ? Number(mf.vat) : null,
      category: mf.category, vendor: mf.vendor || null, description: mf.description || null, source: 'manual' })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('common.saved') })
    if (!error) { setMf({ ...mf, amount: '', vat: '', vendor: '', description: '' }); load() }
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

  const exportCsv = () => downloadCsv(`taptale-ledger-${month}.csv`, [
    ['date', 'type', 'amount', 'vat', 'tax_invoice', 'category', 'vendor', 'description', 'source'],
    ...entries.map((e) => [e.entry_date, e.direction, e.amount, e.vat, e.has_tax_invoice ? 'yes' : '', e.category, e.vendor, e.description, e.source]),
  ])

  return (
    <Page title={t('acct.title')} back="/owner" right={<input type="month" aria-label={t('acct.month')} className="h-10 rounded-lg border border-line bg-white px-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} />}>
      <div className="grid grid-cols-3 gap-2">
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.income')}</span><b>{fmtMoney(income)}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.expense')}</span><b>{fmtMoney(expense)}</b></Card>
        <Card className="!gap-0 !p-3"><span className="text-xs text-muted">{t('acct.net')}</span><b className={income - expense >= 0 ? 'text-ok' : 'text-bad'}>{fmtMoney(income - expense)}</b></Card>
      </div>
      <Seg label={t('acct.mode')} value={tab} onChange={setTab} options={[
        { value: 'review', label: `${t('acct.review')}${pending.length ? ` (${pending.length})` : ''}` }, { value: 'manual', label: t('acct.manual') }, { value: 'pos', label: t('acct.pos') }]} />
      <Msg msg={msg} />

      {tab === 'review' && (
        <Card>
          <span className="text-[15px] font-semibold">{t('acct.pending')}</span>
          <span className="text-xs text-muted">{t('acct.ai_note')}</span>
          {pending.length === 0 && <Empty>{t('acct.no_pending')}</Empty>}
          {pending.map((r) => <ReceiptReview key={r.id} r={r} onDone={load} />)}
        </Card>
      )}

      {tab === 'manual' && (
        <Card>
          <Seg label={t('acct.type')} value={mf.direction} onChange={(v) => setMf({ ...mf, direction: v })} options={[{ value: 'expense', label: t('acct.expense') }, { value: 'income', label: t('acct.income') }]} />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t('common.date')}><input type="date" className={inputCls} value={mf.entry_date} onChange={(e) => setMf({ ...mf, entry_date: e.target.value })} /></Field>
            <Field label={t('common.amount')}><input className={inputCls} inputMode="decimal" value={mf.amount} onChange={(e) => setMf({ ...mf, amount: e.target.value })} /></Field>
            <Field label={t('acct.category')}>
              <select className={inputCls} value={mf.category} onChange={(e) => setMf({ ...mf, category: e.target.value })}>{CATS.map((c) => <option key={c} value={c}>{t(`acct.c_${c}`)}</option>)}</select>
            </Field>
            <Field label="VAT"><input className={inputCls} inputMode="decimal" value={mf.vat} onChange={(e) => setMf({ ...mf, vat: e.target.value })} /></Field>
          </div>
          <Field label={t('acct.vendor')}><input className={inputCls} value={mf.vendor} onChange={(e) => setMf({ ...mf, vendor: e.target.value })} /></Field>
          <Field label={t('common.note')}><input className={inputCls} value={mf.description} onChange={(e) => setMf({ ...mf, description: e.target.value })} /></Field>
          <Button variant="primary" disabled={busy || !Number(mf.amount)} onClick={addManual}>{t('common.save')}</Button>
        </Card>
      )}

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
        <Row><span className="text-[15px] font-semibold">{t('acct.entries')}</span><Button small onClick={exportCsv}>{t('common.export')}</Button></Row>
        {entries.length === 0 && <Empty>{t('common.none')}</Empty>}
        {entries.map((e) => (
          <Row key={e.id}>
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{e.vendor || e.description || t(`acct.c_${e.category ?? 'other'}`)}</span>
              <span className="text-xs text-muted">{fmtDate(e.entry_date)} · {t(`acct.c_${e.category ?? 'other'}`)} · {t(`acct.s_${e.source}`)}</span>
            </span>
            <span className={e.direction === 'income' ? 'text-ok' : ''}>{e.direction === 'income' ? '+' : '−'}{fmtMoney(e.amount)}</span>
          </Row>
        ))}
      </Card>
      <Pill>{t('acct.drive_note')}</Pill>
    </Page>
  )
}
