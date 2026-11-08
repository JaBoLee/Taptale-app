import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, ymd, uploadPhoto, fmtMoney, fmtTime, loadShiftTypes, type ShiftType } from '../lib/db'
import { Button, Card, Field, Msg, Page, Row, Seg, inputCls } from '../components/ui'

const REASONS = ['change', 'fresh_food', 'delivery', 'other'] as const
interface Move { id: string; direction: 'in' | 'out'; amount: number; reason: string; note: string | null; created_at: string }

export default function ShiftClose() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [types, setTypes] = useState<ShiftType[]>([])
  const [f, setF] = useState({ work_date: ymd(), shift_code: '', bill_count: '', bill_total: '', cash_open: '', cash_close: '' })
  const [file, setFile] = useState<File | null>(null)
  const [m, setM] = useState({ direction: 'out' as 'in' | 'out', amount: '', reason: 'fresh_food', note: '' })
  const [mFile, setMFile] = useState<File | null>(null)
  const [moves, setMoves] = useState<Move[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [msg2, setMsg2] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    const [ty, last, { data: asg }, { data: mv }] = await Promise.all([
      loadShiftTypes(),
      sb.rpc('last_cash_close'),
      sb.from('shift_assignments').select('shift_code').eq('profile_id', profile.id).eq('work_date', ymd()).maybeSingle(),
      sb.from('cash_movements').select('*').eq('created_by', profile.id).gte('created_at', ymd() + 'T00:00:00+07:00').order('created_at', { ascending: false }),
    ])
    setTypes(ty)
    setMoves((mv as Move[]) ?? [])
    setF((p) => ({ ...p, shift_code: p.shift_code || (asg as { shift_code: string | null } | null)?.shift_code || '',
      cash_open: p.cash_open || (last.data != null ? String(last.data) : '') }))
  }, [profile])
  useEffect(() => { load() }, [load])

  const close = async () => {
    if (!f.cash_close || !f.cash_open) { setMsg({ ok: false, text: t('close.need_cash') }); return }
    setBusy(true)
    try {
      const photo = file ? await uploadPhoto(file, 'shift-close') : null
      const { error } = await sb.from('shift_closes').insert({
        profile_id: profile?.id, work_date: f.work_date, shift_code: f.shift_code || null,
        bill_count: f.bill_count ? Number(f.bill_count) : null, bill_total: f.bill_total ? Number(f.bill_total) : null,
        cash_open: Number(f.cash_open), cash_close: Number(f.cash_close), photo_path: photo,
      })
      if (error) throw error
      setMsg({ ok: true, text: t('close.saved') })
      setF({ ...f, bill_count: '', bill_total: '', cash_open: '', cash_close: '' }); setFile(null)
    } catch { setMsg({ ok: false, text: t('common.save_failed') }) }
    setBusy(false)
  }

  const addMove = async () => {
    if (!Number(m.amount)) { setMsg2({ ok: false, text: t('close.need_amount') }); return }
    setBusy(true)
    try {
      let receiptId: string | null = null
      if (mFile) {
        const path = await uploadPhoto(mFile, 'receipts')
        const { data: r, error } = await sb.from('receipts').insert({ photo_path: path, supplier_hint: t(`close.r_${m.reason}`), note: m.note || null, uploaded_by: profile?.id }).select('id').single()
        if (error) throw error
        receiptId = (r as { id: string }).id
      }
      const { error } = await sb.from('cash_movements').insert({ direction: m.direction, amount: Number(m.amount), reason: m.reason, note: m.note || null, receipt_id: receiptId, created_by: profile?.id })
      if (error) throw error
      setMsg2({ ok: true, text: t('close.move_saved') })
      setM({ ...m, amount: '', note: '' }); setMFile(null); load()
    } catch { setMsg2({ ok: false, text: t('common.save_failed') }) }
    setBusy(false)
  }

  return (
    <Page title={t('close.title')} back="/">
      <Card>
        <span className="text-[15px] font-semibold">{t('close.close_shift')}</span>
        <Field label={t('close.photo')} hint={t('close.photo_hint')}>
          <input type="file" accept="image/*" capture="environment" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t('common.date')}><input type="date" className={inputCls} value={f.work_date} onChange={(e) => setF({ ...f, work_date: e.target.value })} /></Field>
          <Field label={t('clock.shift')}>
            <select className={inputCls} value={f.shift_code} onChange={(e) => setF({ ...f, shift_code: e.target.value })}>
              <option value="">–</option>{types.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
            </select>
          </Field>
          <Field label={t('close.bills')}><input className={inputCls} inputMode="numeric" value={f.bill_count} onChange={(e) => setF({ ...f, bill_count: e.target.value })} /></Field>
          <Field label={t('close.bill_total')}><input className={inputCls} inputMode="decimal" value={f.bill_total} onChange={(e) => setF({ ...f, bill_total: e.target.value })} /></Field>
          <Field label={t('close.cash_open')} hint={t('close.cash_open_hint')}><input className={inputCls} inputMode="decimal" value={f.cash_open} onChange={(e) => setF({ ...f, cash_open: e.target.value })} /></Field>
          <Field label={t('close.cash_close')}><input className={inputCls} inputMode="decimal" value={f.cash_close} onChange={(e) => setF({ ...f, cash_close: e.target.value })} /></Field>
        </div>
        <Msg msg={msg} />
        <Button variant="primary" disabled={busy} onClick={close}>{t('close.save')}</Button>
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('close.drawer')}</span>
        <Seg label={t('close.direction')} value={m.direction} onChange={(v) => setM({ ...m, direction: v })}
          options={[{ value: 'out', label: t('close.out') }, { value: 'in', label: t('close.in') }]} />
        <Field label={t('common.amount')}><input className={inputCls} inputMode="decimal" value={m.amount} onChange={(e) => setM({ ...m, amount: e.target.value })} /></Field>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button key={r} type="button" aria-pressed={m.reason === r} onClick={() => setM({ ...m, reason: r })}
              className={`h-10 rounded-full border px-4 text-[13px] ${m.reason === r ? 'border-ink bg-ink text-white' : 'border-[#D9D6D0] bg-white text-ink'}`}>{t(`close.r_${r}`)}</button>
          ))}
        </div>
        <Field label={t('common.note')}><input className={inputCls} value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} /></Field>
        <Field label={t('close.attach_receipt')}><input type="file" accept="image/*" capture="environment" className="text-sm" onChange={(e) => setMFile(e.target.files?.[0] ?? null)} /></Field>
        <Msg msg={msg2} />
        <Button variant="primary" disabled={busy} onClick={addMove}>{t('close.save_move')}</Button>
        {moves.map((x) => (
          <Row key={x.id}>
            <span>{x.direction === 'out' ? '−' : '+'}{fmtMoney(Number(x.amount))} · {t(`close.r_${x.reason}`)}{x.note ? ` · ${x.note}` : ''}</span>
            <span className="text-muted">{fmtTime(x.created_at)}</span>
          </Row>
        ))}
      </Card>
    </Page>
  )
}
