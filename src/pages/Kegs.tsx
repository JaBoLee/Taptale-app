import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, fmtDate, fmtDateTime, fmtNum, loadSettings } from '../lib/db'
import { Button, Card, Empty, Field, Loading, Msg, Page, Pill, Row, inputCls, numCls } from '../components/ui'

export interface Keg {
  id: string; beer_name: string; brand: string; keg_type: 'pet' | 'steel'; size_l: number; glass_ml: number; cost: number | null
  status: 'stock' | 'on_tap' | 'empty' | 'cleared'; tap_no: number | null; received_at: string; tapped_at: string | null; emptied_at: string | null
  return_status: 'pending' | 'notified' | 'scheduled' | null; return_date: string | null; cleared_at: string | null
  cleared_how: 'donated' | 'sold' | 'returned' | null; sale_amount: number | null
}
interface Reading { keg_id: string; counter: number; created_at: string; created_by: string }

export const expectedGlasses = (k: Keg) => Math.floor((Number(k.size_l) * 1000) / (k.glass_ml || 500))

export async function loadKegs() {
  const [{ data: kegs }, { data: rd }] = await Promise.all([
    sb.from('kegs').select('*').neq('status', 'cleared').order('tap_no'),
    sb.from('keg_readings').select('keg_id, counter, created_at, created_by').order('created_at', { ascending: false }).limit(500),
  ])
  const latest: Record<string, Reading> = {}
  for (const r of (rd as Reading[]) ?? []) if (!latest[r.keg_id]) latest[r.keg_id] = r
  return { kegs: (kegs as Keg[]) ?? [], latest }
}

function OnTapCard({ k, reading, onDone }: { k: Keg; reading?: Reading; onDone: () => void }) {
  const { t } = useTranslation()
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const exp = expectedGlasses(k)
  const sold = reading?.counter ?? 0
  const days = k.tapped_at ? Math.max((Date.now() - new Date(k.tapped_at).getTime()) / 86400000, 0.5) : 1
  const perDay = sold / days
  const left = Math.max(exp - sold, 0)
  const daysLeft = perDay > 0 ? left / perDay : null
  const pct = exp ? Math.min(100, Math.round((left / exp) * 100)) : 0

  const save = async () => {
    const n = Number(val)
    if (!val || Number.isNaN(n) || n < 0) return
    setBusy(true)
    const { error } = await sb.from('keg_readings').insert({ keg_id: k.id, counter: Math.round(n) })
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
    <Card tone={daysLeft != null && daysLeft < 1.5 ? 'warn' : undefined}>
      <Row>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-wider text-muted">TAP {k.tap_no ?? '–'}</span>
          <span className="text-[15px] font-semibold">{k.beer_name}</span>
          <span className="text-xs text-muted">{k.brand} · {k.keg_type === 'pet' ? 'PET' : t('kegs.steel')} {fmtNum(k.size_l)} L · {t('kegs.tapped', { d: fmtDate(k.tapped_at) })}</span>
        </div>
        {daysLeft != null && <Pill tone={daysLeft < 1.5 ? 'warn' : 'ok'}>{t('kegs.days_left', { n: fmtNum(daysLeft, 1) })}</Pill>}
      </Row>
      <div className="h-1.5 overflow-hidden rounded bg-[#EFEEEA]"><div className={`h-1.5 ${pct < 25 ? 'bg-warn' : 'bg-ok'}`} style={{ width: `${pct}%` }} /></div>
      <Row>
        <span>{t('kegs.counter_now')}</span>
        <span className="flex items-center gap-2">
          <input className={numCls} inputMode="numeric" placeholder={String(sold)} aria-label={t('kegs.counter_now')} value={val} onChange={(e) => setVal(e.target.value)} />
          <span className="text-muted">/ ~{exp}</span>
        </span>
      </Row>
      <span className="text-xs text-muted">{reading ? t('kegs.updated', { when: fmtDateTime(reading.created_at) }) : t('kegs.no_reading')} · {t('kegs.per_day', { n: fmtNum(perDay, 1) })}</span>
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
  const [state, setState] = useState<{ kegs: Keg[]; latest: Record<string, Reading> } | null>(null)
  const [glasses, setGlasses] = useState<number[]>([500])
  const [tapFor, setTapFor] = useState<string | null>(null)
  const [tapNo, setTapNo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [nk, setNk] = useState({ beer_name: '', brand: '', keg_type: 'pet' as 'pet' | 'steel', size_l: '20', glass_ml: '500', cost: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => setState(await loadKegs()), [])
  useEffect(() => {
    load()
    loadSettings().then((s) => { if (Array.isArray(s.glass_sizes_ml) && s.glass_sizes_ml.length) setGlasses(s.glass_sizes_ml) })
  }, [load])

  if (!state) return <Page title={t('kegs.title')}><Loading /></Page>
  const onTap = state.kegs.filter((k) => k.status === 'on_tap').sort((a, b) => (a.tap_no ?? 99) - (b.tap_no ?? 99))
  const inStock = state.kegs.filter((k) => k.status === 'stock')
  const empty = state.kegs.filter((k) => k.status === 'empty')

  const tap = async (k: Keg) => {
    setBusy(true)
    const { error } = await sb.from('kegs').update({ status: 'on_tap', tapped_at: new Date().toISOString(), tap_no: Number(tapNo) || null }).eq('id', k.id)
    if (!error) await sb.from('keg_readings').insert({ keg_id: k.id, counter: 0 })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('kegs.tapped_ok') })
    setTapFor(null); setTapNo(''); await load(); setBusy(false)
  }

  const addKeg = async () => {
    if (!nk.beer_name.trim() || !nk.brand.trim() || !Number(nk.size_l)) { setMsg({ ok: false, text: t('kegs.need') }); return }
    setBusy(true)
    const { error } = await sb.from('kegs').insert({ beer_name: nk.beer_name.trim(), brand: nk.brand.trim(), keg_type: nk.keg_type,
      size_l: Number(nk.size_l), glass_ml: Number(nk.glass_ml) || 500, cost: nk.cost ? Number(nk.cost) : null, status: 'stock' })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('kegs.added') })
    if (!error) { setShowAdd(false); setNk({ ...nk, beer_name: '', cost: '' }); await load() }
    setBusy(false)
  }

  return (
    <Page title={t('kegs.title')} subtitle={t('kegs.subtitle')}>
      <Msg msg={msg} />
      {onTap.length === 0 && <Empty>{t('kegs.none_on_tap')}</Empty>}
      {onTap.map((k) => <OnTapCard key={k.id} k={k} reading={state.latest[k.id]} onDone={load} />)}

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
                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <Field label={t('kegs.tap_no')}><input className={inputCls} inputMode="numeric" value={tapNo} onChange={(e) => setTapNo(e.target.value)} /></Field>
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
        {profile?.role === 'owner' ? <Link to="/empty-kegs" className="flex min-h-11 items-center text-sm font-semibold underline">{t('kegs.manage_empty')}</Link>
          : <span className="text-xs text-muted">{t('kegs.owner_clears')}</span>}
      </Card>
    </Page>
  )
}
