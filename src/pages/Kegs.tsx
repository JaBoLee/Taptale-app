import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, fmtDate, fmtDateTime, fmtNum, loadSettings, ymd } from '../lib/db'
import { Button, Card, Empty, Field, Loading, Msg, Page, Pill, Row, inputCls, numCls } from '../components/ui'

export interface Keg {
  id: string; beer_name: string; brand: string; keg_type: 'pet' | 'steel'; size_l: number; glass_ml: number; cost: number | null
  status: 'stock' | 'on_tap' | 'empty' | 'cleared'; tap_no: number | null; received_at: string; tapped_at: string | null; emptied_at: string | null
  return_status: 'pending' | 'notified' | 'scheduled' | null; return_date: string | null; cleared_at: string | null
  cleared_how: 'donated' | 'sold' | 'returned' | null; sale_amount: number | null; expected_glasses?: number | null
}
export interface Reading { id: string; keg_id: string; counter: number; created_at: string; created_by: string }

/** แก้วที่ขายได้ต่อถัง: ใช้ค่าที่ตั้งไว้ของถัง ถ้าไม่มีคิดจาก 3.75 แก้ว/ลิตร สำหรับแก้ว 250 ml (ถัง 20 ล. ≈ 75 แก้ว ตามที่ร้านขายได้จริง)
 *  แก้วใหญ่กว่า → แก้วน้อยลงตามสัดส่วน เช่น แก้ว 500 ml ถัง 20 ล. ≈ 38 แก้ว */
export const GLASSES_PER_L = 3.75
export const defaultGlasses = (sizeL: number, glassMl = 250) => Math.round(Number(sizeL) * GLASSES_PER_L * 250 / (Number(glassMl) || 250))
export const expectedGlasses = (k: Keg) => (k.expected_glasses && k.expected_glasses > 0 ? k.expected_glasses : defaultGlasses(k.size_l, k.glass_ml))

/** วันที่ที่เลือก → timestamp: วันนี้ = ตอนนี้, วันอื่น = เที่ยงวันของวันนั้น (เวลาไทย) */
const dayTime = (date: string) => (date === ymd() ? new Date().toISOString() : new Date(`${date}T12:00:00+07:00`).toISOString())

export async function loadKegs() {
  const [{ data: kegs }, { data: rd }] = await Promise.all([
    sb.from('kegs').select('*').neq('status', 'cleared').order('tap_no'),
    sb.from('keg_readings').select('id, keg_id, counter, created_at, created_by').order('created_at', { ascending: false }).limit(500),
  ])
  const latest: Record<string, Reading> = {}
  const readings = (rd as Reading[]) ?? []
  for (const r of readings) if (!latest[r.keg_id]) latest[r.keg_id] = r
  return { kegs: (kegs as Keg[]) ?? [], latest, readings }
}

/** วันที่ที่เลือก → เวลาที่บันทึก: วันนี้ = ตอนนี้, วันก่อนหน้า = 23:59 ของวันนั้น (เวลาไทย) */
export const readingTime = (date: string) =>
  date === ymd() ? new Date().toISOString() : new Date(`${date}T23:59:00+07:00`).toISOString()

function ReadingRow({ r, keg, onDone }: { r: Reading; keg?: Keg; onDone: () => void }) {
  const { t } = useTranslation()
  const [edit, setEdit] = useState(false)
  const [date, setDate] = useState(ymd(new Date(r.created_at)))
  const [val, setVal] = useState(String(r.counter))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const save = async () => {
    const n = Number(val)
    if (val === '' || Number.isNaN(n) || n < 0) return
    setBusy(true)
    const keepTime = date === ymd(new Date(r.created_at))
    const { data, error } = await sb.from('keg_readings')
      .update({ counter: Math.round(n), created_at: keepTime ? r.created_at : readingTime(date) })
      .eq('id', r.id).select('id')
    setBusy(false)
    if (error) { setMsg({ ok: false, text: t('common.save_failed') }); return }
    if (!data || data.length === 0) { setMsg({ ok: false, text: t('kegs.edit_denied') }); return }
    setEdit(false); setMsg(null); onDone()
  }

  if (!edit) {
    return (
      <div className="flex min-h-[52px] items-center justify-between gap-2 border-t border-line pt-1.5 text-sm">
        <span className="flex min-w-0 flex-col">
          <span className="truncate">TAP {keg?.tap_no ?? '–'} · {keg?.beer_name ?? '–'}</span>
          <span className="text-xs text-muted">{fmtDateTime(r.created_at)}</span>
        </span>
        <span className="flex items-center gap-1">
          <b className="text-[15px]">{r.counter}</b>
          <button type="button" aria-label={t('kegs.edit_aria', { when: fmtDateTime(r.created_at) })} onClick={() => setEdit(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
          </button>
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-amberbg p-3">
      <span className="text-xs font-semibold text-amberink">{t('kegs.editing', { tap: keg?.tap_no ?? '–', name: keg?.beer_name ?? '' })}</span>
      <div className="flex gap-2">
        <input type="date" className={`${inputCls} min-w-0 flex-1`} aria-label={t('kegs.read_date')} max={ymd()} value={date} onChange={(e) => setDate(e.target.value)} />
        <input className={numCls} inputMode="numeric" aria-label={t('kegs.counter_now')} value={val} onChange={(e) => setVal(e.target.value)} />
      </div>
      <Msg msg={msg} />
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => { setEdit(false); setMsg(null) }}>{t('common.cancel')}</Button>
        <Button variant="primary" disabled={busy} onClick={save}>{t('kegs.save_edit')}</Button>
      </div>
    </div>
  )
}

function OnTapCard({ k, reading, date, onDone }: { k: Keg; reading?: Reading; date: string; onDone: () => void }) {
  const { t } = useTranslation()
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const exp = expectedGlasses(k)
  const sold = reading?.counter ?? 0
  const [editK, setEditK] = useState(false)
  const [kd, setKd] = useState({ tapped: ymd(k.tapped_at ? new Date(k.tapped_at) : new Date()), glasses: String(exp) })
  const saveKeg = async () => {
    setBusy(true)
    const sameDay = k.tapped_at && kd.tapped === ymd(new Date(k.tapped_at))
    const base = { tapped_at: sameDay ? k.tapped_at : new Date(`${kd.tapped}T12:00:00+07:00`).toISOString() }
    let { data, error } = await sb.from('kegs').update({ ...base, expected_glasses: Number(kd.glasses) || null }).eq('id', k.id).select('id')
    if (error && /expected_glasses/.test(error.message)) ({ data, error } = await sb.from('kegs').update(base).eq('id', k.id).select('id'))
    setBusy(false)
    if (error || !data?.length) { setMsg({ ok: false, text: t('common.save_failed') }); return }
    setEditK(false); setMsg(null); onDone()
  }
  const days = k.tapped_at ? Math.max((Date.now() - new Date(k.tapped_at).getTime()) / 86400000, 0.5) : 1
  const perDay = sold / days
  const left = Math.max(exp - sold, 0)
  const daysLeft = perDay > 0 ? left / perDay : null
  const pct = exp ? Math.min(100, Math.round((left / exp) * 100)) : 0

  const save = async () => {
    const n = Number(val)
    if (!val || Number.isNaN(n) || n < 0) return
    setBusy(true)
    const { error } = await sb.from('keg_readings').insert({ keg_id: k.id, counter: Math.round(n), created_at: readingTime(date) })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : n < sold ? { ok: true, text: t('kegs.lower_warn') } : null)
    if (!error) { setVal(''); onDone() }
    setBusy(false)
  }

  const empty = async () => {
    setBusy(true)
    const { error } = await sb.from('kegs').update({ status: 'empty', emptied_at: new Date().toISOString(), tap_no: null,
      return_status: k.keg_type === 'steel' ? 'pending' : null }).eq('id', k.id)
    if (error) setMsg({ ok: false, text: t('common.save_failed') })
    else onDone()
    setBusy(false)
  }

  return (
    <Card>
      <Row>
        <div className="flex flex-col">
          <span className="flex items-center gap-2.5">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${(k.tap_no ?? 0) % 2 ? 'bg-amber text-ink' : 'bg-teal text-white'}`}>{k.tap_no ?? '–'}</span>
            <span className="text-[15px] font-bold">{k.beer_name}</span>
          </span>
          <span className="text-xs text-muted">{k.brand} · {k.keg_type === 'pet' ? 'PET' : t('kegs.steel')} {fmtNum(k.size_l)} L · {t('kegs.tapped', { d: fmtDate(k.tapped_at) })}</span>
        </div>
        {daysLeft != null && <Pill tone={daysLeft < 1.5 ? 'warn' : 'ok'}>{t('kegs.days_left', { n: fmtNum(daysLeft, 1) })}</Pill>}
      </Row>
      <div className="h-2 overflow-hidden rounded-full bg-sand"><div className={`h-2 rounded-full ${pct < 25 ? 'bg-amber' : 'bg-teal'}`} style={{ width: `${pct}%` }} /></div>
      <Row>
        <span>{t('kegs.counter_now')}</span>
        <span className="flex items-center gap-2">
          <input className={numCls} inputMode="numeric" placeholder={String(sold)} aria-label={t('kegs.counter_now')} value={val} onChange={(e) => setVal(e.target.value)} />
          <span className="text-muted">/ ~{exp}</span>
        </span>
      </Row>
      <span className="text-xs text-muted">{reading ? t('kegs.updated', { when: fmtDateTime(reading.created_at) }) : t('kegs.no_reading')} · {t('kegs.per_day', { n: fmtNum(perDay, 1) })}</span>
      {editK ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-amberbg p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('kegs.tap_date')}><input type="date" className={inputCls} max={ymd()} value={kd.tapped} onChange={(e) => setKd({ ...kd, tapped: e.target.value || ymd() })} /></Field>
            <Field label={t('kegs.glasses_per_keg')}><input className={inputCls} inputMode="numeric" value={kd.glasses} onChange={(e) => setKd({ ...kd, glasses: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setEditK(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" disabled={busy} onClick={saveKeg}>{t('kegs.save_edit')}</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditK(true)} className="min-h-11 self-start text-sm font-semibold text-amberink underline">{t('kegs.edit_keg')}</button>
      )}
      <Msg msg={msg} />
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={busy} onClick={empty}>{t('kegs.empty_btn')}</Button>
        <Button variant="primary" disabled={busy || !val} onClick={save}>{t('kegs.save_counter')}</Button>
      </div>
    </Card>
  )
}

export default function Kegs() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [state, setState] = useState<Awaited<ReturnType<typeof loadKegs>> | null>(null)
  const [date, setDate] = useState(ymd())
  const [glasses, setGlasses] = useState<number[]>([500])
  const [tapFor, setTapFor] = useState<string | null>(null)
  const [tapNo, setTapNo] = useState('')
  const [tapDate, setTapDate] = useState(ymd())
  const [undoFor, setUndoFor] = useState<string | null>(null)
  const [undoTap, setUndoTap] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [nk, setNk] = useState({ beer_name: '', brand: '', keg_type: 'pet' as 'pet' | 'steel', size_l: '20', glass_ml: '250', cost: '', received: ymd(), glasses: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => setState(await loadKegs()), [])
  useEffect(() => {
    load()
    loadSettings().then((s) => {
      if (Array.isArray(s.glass_sizes_ml) && s.glass_sizes_ml.length) {
        const gs = s.glass_sizes_ml as number[]
        setGlasses(gs)
        setNk((v) => (gs.map(String).includes(v.glass_ml) ? v : { ...v, glass_ml: String(gs[0]) }))
      }
    })
  }, [load])

  if (!state) return <Page title={t('kegs.title')}><Loading /></Page>
  const onTap = state.kegs.filter((k) => k.status === 'on_tap').sort((a, b) => (a.tap_no ?? 99) - (b.tap_no ?? 99))
  const inStock = state.kegs.filter((k) => k.status === 'stock')
  const empty = state.kegs.filter((k) => k.status === 'empty')
  // กดหมดผิด: ดึงกลับได้ภายใน 3 วัน (ยังไม่ถูกเคลียร์)
  const undoable = empty.filter((k) => k.emptied_at && Date.now() - new Date(k.emptied_at).getTime() < 3 * 86400e3)

  const undoEmpty = async (k: Keg) => {
    setBusy(true)
    const { data, error } = await sb.from('kegs').update({ status: 'on_tap', emptied_at: null, return_status: null, tap_no: Number(undoTap) || null })
      .eq('id', k.id).select('id')
    setBusy(false)
    setUndoFor(null)
    setMsg(error ? { ok: false, text: t('common.save_failed') } : !data?.length ? { ok: false, text: t('kegs.undo_denied') } : { ok: true, text: t('kegs.undo_done', { name: k.beer_name }) })
    load()
  }
  const recent = state.readings.filter((r) => onTap.some((k) => k.id === r.keg_id)).slice(0, 10)

  const tap = async (k: Keg) => {
    setBusy(true)
    const at = dayTime(tapDate)
    const { error } = await sb.from('kegs').update({ status: 'on_tap', tapped_at: at, tap_no: Number(tapNo) || null }).eq('id', k.id)
    if (!error) await sb.from('keg_readings').insert({ keg_id: k.id, counter: 0, created_at: at })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('kegs.tapped_ok') })
    setTapFor(null); setTapNo(''); setTapDate(ymd()); await load(); setBusy(false)
  }

  const addKeg = async () => {
    if (!nk.beer_name.trim() || !nk.brand.trim() || !Number(nk.size_l)) { setMsg({ ok: false, text: t('kegs.need') }); return }
    setBusy(true)
    const row = { beer_name: nk.beer_name.trim(), brand: nk.brand.trim(), keg_type: nk.keg_type, size_l: Number(nk.size_l),
      glass_ml: Number(nk.glass_ml) || 250, cost: nk.cost ? Number(nk.cost) : null, status: 'stock', received_at: dayTime(nk.received) }
    const glasses = Number(nk.glasses) || defaultGlasses(Number(nk.size_l), Number(nk.glass_ml))
    let { error } = await sb.from('kegs').insert({ ...row, expected_glasses: glasses })
    // ก่อนรัน migration 0007 ยังไม่มีคอลัมน์ expected_glasses → บันทึกโดยไม่มีค่านี้ (ระบบใช้ 3.75 แก้ว/ลิตรแทน)
    if (error && /expected_glasses/.test(error.message)) ({ error } = await sb.from('kegs').insert(row))
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('kegs.added') })
    if (!error) { setShowAdd(false); setNk({ ...nk, beer_name: '', cost: '', received: ymd(), glasses: '' }); await load() }
    setBusy(false)
  }

  return (
    <Page title={t('kegs.title')} subtitle={t('kegs.subtitle')}>
      <Msg msg={msg} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="keg-date" className="text-[13px] font-semibold">{t('kegs.read_date')}</label>
        <div className="flex gap-2">
          <input id="keg-date" type="date" className={`${inputCls} min-w-0 flex-1`} max={ymd()} value={date} onChange={(e) => setDate(e.target.value || ymd())} />
          <Button onClick={() => setDate(ymd())}>{t('kegs.today')}</Button>
        </div>
        <span className="text-xs text-muted">{t('kegs.read_date_hint')}</span>
      </div>
      {onTap.length === 0 && <Empty>{t('kegs.none_on_tap')}</Empty>}
      {onTap.map((k) => <OnTapCard key={k.id} k={k} reading={state.latest[k.id]} date={date} onDone={load} />)}

      {recent.length > 0 && (
        <Card className="!gap-1">
          <span className="text-[15px] font-bold">{t('kegs.history')}</span>
          {recent.map((r) => <ReadingRow key={r.id} r={r} keg={state.kegs.find((k) => k.id === r.keg_id)} onDone={load} />)}
        </Card>
      )}

      <Card>
        <Row><span className="text-[15px] font-semibold">{t('kegs.ready')}</span><Pill>{inStock.length}</Pill></Row>
        {inStock.length === 0 && <span className="text-sm text-muted">{t('common.none')}</span>}
        {inStock.map((k) => (
          <div key={k.id} className="flex flex-col gap-2 border-t border-line pt-2.5">
            <Row>
              <span>{k.beer_name} · {k.brand} · {k.keg_type === 'pet' ? 'PET' : t('kegs.steel')} {fmtNum(k.size_l)} L</span>
              <span className="text-xs text-muted">{t('kegs.received', { d: fmtDate(k.received_at) })}</span>
            </Row>
            {tapFor === k.id ? (
              <div className="flex flex-col gap-2 rounded-xl bg-warnbg p-3">
                <span className="text-sm font-semibold text-warn">{t('kegs.reset_reminder')}</span>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t('kegs.tap_no')}><input className={inputCls} inputMode="numeric" value={tapNo} onChange={(e) => setTapNo(e.target.value)} /></Field>
                  <Field label={t('kegs.tap_date')}><input type="date" className={inputCls} max={ymd()} value={tapDate} onChange={(e) => setTapDate(e.target.value || ymd())} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setTapFor(null)}>{t('common.cancel')}</Button>
                  <Button variant="primary" disabled={busy} onClick={() => tap(k)}>{t('kegs.confirm_tap')}</Button>
                </div>
              </div>
            ) : (
              <Button small onClick={() => setTapFor(k.id)}>{t('kegs.tap_btn')}</Button>
            )}
          </div>
        ))}
        {showAdd ? (
          <div className="flex flex-col gap-2.5 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('kegs.beer')}><input className={inputCls} value={nk.beer_name} onChange={(e) => setNk({ ...nk, beer_name: e.target.value })} /></Field>
              <Field label={t('kegs.brand')}><input className={inputCls} value={nk.brand} onChange={(e) => setNk({ ...nk, brand: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <Field label={t('kegs.type')}>
                <select className={inputCls} value={nk.keg_type} onChange={(e) => setNk({ ...nk, keg_type: e.target.value as 'pet' | 'steel' })}>
                  <option value="pet">PET</option><option value="steel">{t('kegs.steel')}</option>
                </select>
              </Field>
              <Field label={t('kegs.size')}><input className={inputCls} inputMode="decimal" value={nk.size_l} onChange={(e) => setNk({ ...nk, size_l: e.target.value })} /></Field>
              <Field label={t('kegs.glass')}>
                <select className={inputCls} value={nk.glass_ml} onChange={(e) => setNk({ ...nk, glass_ml: e.target.value })}>
                  {glasses.map((g) => <option key={g} value={g}>{g} ml</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('kegs.received_date')}><input type="date" className={inputCls} max={ymd()} value={nk.received} onChange={(e) => setNk({ ...nk, received: e.target.value || ymd() })} /></Field>
              <Field label={t('kegs.glasses_per_keg')}><input className={inputCls} inputMode="numeric" placeholder={String(defaultGlasses(Number(nk.size_l) || 0, Number(nk.glass_ml)))} value={nk.glasses} onChange={(e) => setNk({ ...nk, glasses: e.target.value })} /></Field>
            </div>
            {profile?.role === 'owner' && <Field label={t('kegs.cost')}><input className={inputCls} inputMode="decimal" value={nk.cost} onChange={(e) => setNk({ ...nk, cost: e.target.value })} /></Field>}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" disabled={busy} onClick={addKeg}>{t('kegs.add')}</Button>
            </div>
          </div>
        ) : (
          <Button small onClick={() => setShowAdd(true)}>{t('kegs.receive_btn')}</Button>
        )}
      </Card>

      <Card>
        <Row><span className="text-[15px] font-semibold">{t('kegs.empty_title')}</span><Pill tone={empty.length ? 'warn' : 'mute'}>{empty.length}</Pill></Row>
        <Row><span>{t('kegs.pet_wait')}</span><span>{empty.filter((k) => k.keg_type === 'pet').length}</span></Row>
        <Row><span>{t('kegs.steel_wait')}</span><span>{empty.filter((k) => k.keg_type === 'steel').length}</span></Row>
        {undoable.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-line pt-2.5">
            <span className="text-xs text-muted">{t('kegs.undo_hint')}</span>
            {undoable.map((k) => (
              <div key={k.id} className="flex flex-col gap-2">
                <Row>
                  <span className="flex min-w-0 flex-col"><span className="font-semibold">{k.beer_name}</span><span className="text-xs text-muted">{t('kegs.emptied_at', { when: fmtDateTime(k.emptied_at) })}</span></span>
                  {undoFor !== k.id && <Button small onClick={() => { setUndoFor(k.id); setUndoTap('') }}>{t('kegs.undo_btn')}</Button>}
                </Row>
                {undoFor === k.id && (
                  <div className="flex flex-col gap-2 rounded-2xl bg-amberbg p-3">
                    <Field label={t('kegs.tap_no')}><input className={inputCls} inputMode="numeric" value={undoTap} onChange={(e) => setUndoTap(e.target.value)} /></Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setUndoFor(null)}>{t('common.cancel')}</Button>
                      <Button variant="primary" disabled={busy} onClick={() => undoEmpty(k)}>{t('kegs.undo_confirm')}</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {profile?.role === 'owner' ? <Link to="/empty-kegs" className="flex min-h-11 items-center text-sm font-semibold underline">{t('kegs.manage_empty')}</Link>
          : <span className="text-xs text-muted">{t('kegs.owner_clears')}</span>}
      </Card>
    </Page>
  )
}
