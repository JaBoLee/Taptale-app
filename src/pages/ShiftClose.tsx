import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, ymd, uploadPhoto, fmtMoney, fmtTime, loadShiftTypes, loadMembers, type ShiftType, type Member } from '../lib/db'
import { LineEditor, linesTotal, toRows, validLines, type Line } from '../components/LineEditor'
import { Button, Card, Field, Msg, Page, Pill, Row, Seg, inputCls } from '../components/ui'

const REASONS_OUT = ['change', 'fresh_food', 'delivery', 'safekeep', 'other'] as const
const REASONS_IN = ['change', 'other'] as const
const PAYS = ['cash', 'qr', 'card'] as const
type Pay = typeof PAYS[number]
interface Fix { bill_no: string; amount: number; recorded_as: Pay; actual: Pay; note: string }
/** ผลต่อเงินสดในลิ้นชัก: จ่ายจริงเป็นเงินสด = เงินสดเพิ่ม, POS กดเป็นเงินสด (แต่จริงไม่ใช่) = เงินสดลด */
export const cashEffect = (fx: { amount: number; recorded_as: string; actual: string }[]) =>
  fx.reduce((s, x) => s + (x.actual === 'cash' ? x.amount : 0) - (x.recorded_as === 'cash' ? x.amount : 0), 0)
interface Move { id: string; direction: 'in' | 'out'; amount: number; reason: string; note: string | null; created_at: string }

function PayPick({ label, value, tone, onPick }: { label: string; value: Pay | ''; tone: 'bad' | 'ok'; onPick: (v: Pay) => void }) {
  const { t } = useTranslation()
  const on = tone === 'bad' ? 'border-danger bg-badbg text-bad' : 'border-teal bg-tealbg text-tealink'
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      <div role="group" aria-label={label} className="grid grid-cols-3 gap-1.5">
        {PAYS.map((p) => (
          <button key={p} type="button" aria-pressed={value === p} onClick={() => onPick(p)}
            className={`min-h-11 rounded-xl border-[1.5px] text-[13px] font-semibold ${value === p ? on : 'border-edge bg-white text-ink'}`}>{t(`fix.p_${p}`)}</button>
        ))}
      </div>
    </div>
  )
}

export default function ShiftClose() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [types, setTypes] = useState<ShiftType[]>([])
  const [f, setF] = useState({ work_date: ymd(), shift_code: '', bill_count: '', bill_total: '', cash_open: '', cash_close: '' })
  const [file, setFile] = useState<File | null>(null)
  const [m, setM] = useState({ direction: 'out' as 'in' | 'out', amount: '', reason: 'fresh_food', note: '', holder: '' })
  const [mLines, setMLines] = useState<Line[]>([])
  const [owners, setOwners] = useState<Member[]>([])
  useEffect(() => { loadMembers().then((ms) => setOwners(ms.filter((x) => x.role === 'owner'))) }, [])
  const [mFile, setMFile] = useState<File | null>(null)
  const [moves, setMoves] = useState<Move[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [msg2, setMsg2] = useState<{ ok: boolean; text: string } | null>(null)
  const [fixes, setFixes] = useState<Fix[]>([])
  const [fx, setFx] = useState({ bill_no: '', amount: '', recorded_as: '' as Pay | '', actual: '' as Pay | '', note: '' })
  const [fixMsg, setFixMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [fixReady, setFixReady] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    const [ty, probe, { data: asg }, { data: mv }] = await Promise.all([
      loadShiftTypes(),
      sb.from('payment_fixes').select('id', { count: 'exact', head: true }).limit(1),
      sb.from('shift_assignments').select('shift_code').eq('profile_id', profile.id).eq('work_date', ymd()).maybeSingle(),
      sb.from('cash_movements').select('*').eq('created_by', profile.id).gte('created_at', ymd() + 'T00:00:00+07:00').order('created_at', { ascending: false }),
    ])
    setTypes(ty)
    setFixReady(!probe.error) // ตารางยังไม่ถูกสร้าง → ซ่อนส่วนนี้ไว้ก่อน
    setMoves((mv as Move[]) ?? [])
    // ไม่เติมเงินเปิดกะจากกะก่อน: พนักงานต้องนับและกรอกเอง แล้วระบบเทียบให้เจ้าของดู
    setF((p) => ({ ...p, shift_code: p.shift_code || (asg as { shift_code: string | null } | null)?.shift_code || '' }))
  }, [profile])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (location.hash === '#drawer') setTimeout(() => document.getElementById('drawer')?.scrollIntoView(), 400) }, [])

  const close = async () => {
    if (!f.cash_close || !f.cash_open) { setMsg({ ok: false, text: t('close.need_cash') }); return }
    setBusy(true)
    try {
      const photo = file ? await uploadPhoto(file, 'shift-close') : null
      const { data: sc, error } = await sb.from('shift_closes').insert({
        profile_id: profile?.id, work_date: f.work_date, shift_code: f.shift_code || null,
        bill_count: f.bill_count ? Number(f.bill_count) : null, bill_total: f.bill_total ? Number(f.bill_total) : null,
        cash_open: Number(f.cash_open), cash_close: Number(f.cash_close), photo_path: photo,
      }).select('id').single()
      if (error) throw error
      let fixFailed = false
      if (fixes.length && fixReady) {
        const { error: e2 } = await sb.from('payment_fixes').insert(fixes.map((x) => ({
          shift_close_id: (sc as { id: string }).id, work_date: f.work_date, shift_code: f.shift_code || null,
          bill_no: x.bill_no || null, amount: x.amount, recorded_as: x.recorded_as, actual: x.actual, note: x.note || null, created_by: profile?.id,
        })))
        fixFailed = !!e2
      }
      setMsg(fixFailed ? { ok: false, text: t('fix.save_failed') } : { ok: true, text: t('close.saved') })
      setF({ ...f, bill_count: '', bill_total: '', cash_open: '', cash_close: '' }); setFile(null)
      setFixes([])
    } catch { setMsg({ ok: false, text: t('common.save_failed') }) }
    setBusy(false)
  }

  const addFix = () => {
    const amount = Number(fx.amount)
    if (!amount || amount <= 0 || !fx.recorded_as || !fx.actual) { setFixMsg({ ok: false, text: t('fix.need') }); return }
    if (fx.recorded_as === fx.actual) { setFixMsg({ ok: false, text: t('fix.same') }); return }
    setFixes([...fixes, { bill_no: fx.bill_no.trim(), amount, recorded_as: fx.recorded_as, actual: fx.actual, note: fx.note.trim() }])
    setFx({ bill_no: '', amount: '', recorded_as: '', actual: '', note: '' })
    setFixMsg(null)
  }
  const effect = cashEffect(fixes)
  const moveNet = moves.reduce((n, x) => n + (x.direction === 'in' ? 1 : -1) * Number(x.amount), 0)

  const addMove = async () => {
    const withLines = m.direction === 'out' && ['fresh_food', 'delivery', 'other'].includes(m.reason)
    const amount = Number(m.amount) || (withLines ? linesTotal(mLines) : 0)
    if (!amount) { setMsg2({ ok: false, text: t('close.need_amount') }); return }
    if (m.reason === 'other' && !m.note.trim()) { setMsg2({ ok: false, text: t('close.need_note') }); return }
    if (m.reason === 'safekeep' && !m.holder) { setMsg2({ ok: false, text: t('close.need_who') }); return }
    const holderId = m.holder && m.holder !== 'bank' ? m.holder : null
    const holderName = m.holder === 'bank' ? t('close.bank') : owners.find((o) => o.id === m.holder)?.display_name
    const note = m.note.trim() || (m.reason === 'safekeep' ? holderName ?? '' : '')
    setBusy(true)
    try {
      let receiptId: string | null = null
      if (mFile) {
        const path = await uploadPhoto(mFile, 'receipts')
        const { data: r, error } = await sb.from('receipts').insert({ photo_path: path, supplier_hint: t(`close.r_${m.reason}`), note: m.note || null, uploaded_by: profile?.id, kind: 'cash' }).select('id').single()
        if (error) throw error
        receiptId = (r as { id: string }).id
      }
      const row: Record<string, unknown> = { direction: m.direction, amount, reason: m.reason, note: note || null, receipt_id: receiptId, created_by: profile?.id }
      if (holderId) row.holder_id = holderId
      const { data: mv, error } = await sb.from('cash_movements').insert(row).select('id').single()
      if (error) throw error
      if (withLines && validLines(mLines).length) {
        const { error: le } = await sb.from('ledger_lines').insert(toRows(mLines, { cash_movement_id: (mv as { id: string }).id }))
        if (le) throw le
      }
      setMsg2({ ok: true, text: t('close.move_saved') })
      setM({ ...m, amount: '', note: '', holder: '' }); setMLines([]); setMFile(null); load()
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
        {fixReady && (
          <div className="flex flex-col gap-2.5 border-t border-line pt-3">
            <Row><span className="text-[15px] font-bold">{t('fix.title')}</span>{fixes.length > 0 && <Pill tone="warn">{t('fix.count', { n: fixes.length })}</Pill>}</Row>
            <span className="text-xs text-muted">{t('fix.hint')}</span>
            {fixes.map((x, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-field py-1.5 pl-3 pr-1">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-semibold">{x.bill_no ? `#${x.bill_no} · ` : ''}{fmtMoney(x.amount)}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Pill tone="bad">{t('fix.was', { p: t(`fix.p_${x.recorded_as}`) })}</Pill><span aria-hidden="true">→</span><Pill tone="ok">{t('fix.real', { p: t(`fix.p_${x.actual}`) })}</Pill>
                  </span>
                  {x.note && <span className="text-xs text-muted">{x.note}</span>}
                </span>
                <button type="button" aria-label={t('fix.remove')} onClick={() => setFixes(fixes.filter((_, j) => j !== i))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))}
            <div className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-dashed border-edge p-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('fix.bill_no')}><input className={inputCls} inputMode="numeric" value={fx.bill_no} onChange={(e) => setFx({ ...fx, bill_no: e.target.value })} /></Field>
                <Field label={t('common.amount')}><input className={inputCls} inputMode="decimal" value={fx.amount} onChange={(e) => setFx({ ...fx, amount: e.target.value })} /></Field>
              </div>
              <PayPick label={t('fix.recorded')} value={fx.recorded_as} tone="bad" onPick={(v) => setFx({ ...fx, recorded_as: v })} />
              <PayPick label={t('fix.actual')} value={fx.actual} tone="ok" onPick={(v) => setFx({ ...fx, actual: v })} />
              <Field label={t('common.note')}><input className={inputCls} value={fx.note} onChange={(e) => setFx({ ...fx, note: e.target.value })} /></Field>
              <Msg msg={fixMsg} />
              <Button onClick={addFix} className="!border-teal !text-tealink">+ {t('fix.add')}</Button>
            </div>
            {fixes.length > 0 && (
              <div className="flex flex-col gap-1 rounded-2xl bg-ink p-3.5 text-white">
                <Row><span className="text-herosub">{t('fix.effect')}</span><b className="text-amber">{effect > 0 ? '+' : ''}{fmtMoney(effect)}</b></Row>
                <span className="text-xs text-herosub">{t('fix.effect_hint')}</span>
              </div>
            )}
          </div>
        )}
        <Msg msg={msg} />
        <Button variant="primary" disabled={busy} onClick={close}>{t('close.save')}</Button>
      </Card>

      <Card>
        <Row><span id="drawer" className="scroll-mt-4 text-[15px] font-bold">{t('close.drawer')}</span>{moves.length > 0 && <Pill tone="warn">{t('close.moves_today', { n: moves.length })}</Pill>}</Row>
        {moves.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {moves.map((x) => (
              <div key={x.id} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-field px-3 py-1.5 text-sm">
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{t(`close.r_${x.reason}`)}{x.note ? ` · ${x.note}` : ''}</span>
                  <span className="text-xs text-muted">{fmtTime(x.created_at)}</span>
                </span>
                <b className={x.direction === 'out' ? 'text-bad' : 'text-tealink'}>{x.direction === 'out' ? '−' : '+'}{fmtMoney(Number(x.amount))}</b>
              </div>
            ))}
            <Row className="px-1 pt-1">
              <span className="text-muted">{t('close.moves_total')}</span>
              <b>{moveNet > 0 ? '+' : moveNet < 0 ? '−' : ''}{fmtMoney(Math.abs(moveNet))}</b>
            </Row>
          </div>
        )}
        <div className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-dashed border-edge p-3">
          <span className="text-[13px] font-semibold">{moves.length ? t('close.add_another') : t('close.add_first')}</span>
          <Seg label={t('close.direction')} value={m.direction} onChange={(v) => setM({ ...m, direction: v, reason: v === 'in' ? 'change' : m.reason })}
            options={[{ value: 'out', label: t('close.out') }, { value: 'in', label: t('close.in') }]} />
          <div className="flex flex-wrap gap-2">
            {(m.direction === 'in' ? REASONS_IN : REASONS_OUT).map((r) => (
              <button key={r} type="button" aria-pressed={m.reason === r} onClick={() => setM({ ...m, reason: r })}
                className={`min-h-11 rounded-full border-[1.5px] px-4 text-[13px] font-semibold ${m.reason === r ? 'border-ink bg-ink text-white' : 'border-edge bg-white text-ink'}`}>{t(`close.r_${r}`)}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('common.amount')}><input className={inputCls} inputMode="decimal" value={m.amount} onChange={(e) => setM({ ...m, amount: e.target.value })} /></Field>
            <Field label={t('common.note')}><input className={inputCls} value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} /></Field>
          </div>
          {(m.reason === 'safekeep' || m.direction === 'in') && (
            <Field label={m.reason === 'safekeep' ? t('close.who') : t('close.from_owner')}>
              <select className={inputCls} value={m.holder} onChange={(e) => setM({ ...m, holder: e.target.value })}>
                <option value="">{m.reason === 'safekeep' ? t('common.choose') : t('close.from_none')}</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.display_name}</option>)}
                {m.reason === 'safekeep' && <option value="bank">{t('close.bank')}</option>}
              </select>
            </Field>
          )}
          {m.direction === 'out' && ['fresh_food', 'delivery', 'other'].includes(m.reason) && <LineEditor lines={mLines} onChange={setMLines} stockDefault />}
          <span className="text-xs text-muted">{t(m.direction === 'in' ? 'close.hint_in' : m.reason === 'safekeep' ? 'close.hint_safekeep' : m.reason === 'change' ? 'close.hint_change' : 'close.hint_expense')}</span>
          <Field label={t('close.attach_receipt')}><input key={moves.length} type="file" accept="image/*" capture="environment" className="text-sm" onChange={(e) => setMFile(e.target.files?.[0] ?? null)} /></Field>
          <Msg msg={msg2} />
          <Button disabled={busy} onClick={addMove} className="!border-teal !text-tealink">+ {t('close.save_move')}</Button>
        </div>
      </Card>
    </Page>
  )
}
