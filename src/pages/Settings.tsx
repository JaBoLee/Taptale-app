import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sb, loadSettings, loadShiftTypes, type Settings as S, type ShiftType } from '../lib/db'
import { Button, Card, Field, Loading, Msg, Page, Row, inputCls } from '../components/ui'
import { backupNow } from '../lib/gsync'

const num = (v: string) => (v.trim() === '' ? 0 : Number(v))

export default function Settings() {
  const { t } = useTranslation()
  const [s, setS] = useState<Record<string, string> | null>(null)
  const [shifts, setShifts] = useState<ShiftType[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [gUrl, setGUrl] = useState<string | null>(null)
  const [gMsg, setGMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [gBusy, setGBusy] = useState(false)

  useEffect(() => {
    Promise.all([loadSettings(), loadShiftTypes()]).then(([v, st]) => {
      const loc = v.shop_location ?? { lat: null, lng: null, radius_m: 100 }
      const late = v.late_rules ?? { grace_min: 0, deduct_per_min: 0, ot_per_min: 0 }
      const lr = v.leave_rules ?? { sick_days: 0, sick_paid: true, personal_days: 0, personal_paid: false }
      setS({
        lat: String(loc.lat ?? ''), lng: String(loc.lng ?? ''), radius: String(loc.radius_m ?? 100),
        grace: String(late.grace_min), deduct: String(late.deduct_per_min), ot: String(late.ot_per_min),
        sick_days: String(lr.sick_days), sick_paid: lr.sick_paid ? '1' : '', personal_days: String(lr.personal_days), personal_paid: lr.personal_paid ? '1' : '',
        tolerance: String(v.cash_tolerance?.amount ?? 0), max_kegs: String(v.empty_keg_alert?.max_kegs ?? 4), max_days: String(v.empty_keg_alert?.max_days ?? 7),
        glasses: (v.glass_sizes_ml ?? [500]).join(', '),
      })
      setShifts(st)
      setGUrl((v as Record<string, { sheet_url?: string }>).google?.sheet_url ?? null)
    })
  }, [])

  if (!s) return <Page title={t('set.title')} back="/owner"><Loading /></Page>
  const set = (k: string, v: string) => setS({ ...s, [k]: v })

  const save = async () => {
    setBusy(true)
    const values: Partial<S> = {
      shop_location: { lat: s.lat ? Number(s.lat) : null, lng: s.lng ? Number(s.lng) : null, radius_m: num(s.radius) || 100 },
      late_rules: { grace_min: num(s.grace), deduct_per_min: num(s.deduct), ot_per_min: num(s.ot) },
      leave_rules: { sick_days: num(s.sick_days), sick_paid: !!s.sick_paid, personal_days: num(s.personal_days), personal_paid: !!s.personal_paid },
      cash_tolerance: { amount: num(s.tolerance) },
      empty_keg_alert: { max_kegs: num(s.max_kegs), max_days: num(s.max_days) },
      glass_sizes_ml: s.glasses.split(/[,\s]+/).map(Number).filter((n) => n > 0),
    }
    const rows = Object.entries(values).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
    const a = await sb.from('app_settings').upsert(rows, { onConflict: 'key' })
    const b = await sb.from('shift_types').upsert(shifts.map((x) => ({ code: x.code, start_time: x.start_time, end_time: x.end_time, sort: x.sort })), { onConflict: 'code' })
    setMsg(a.error || b.error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('common.saved') })
    setBusy(false)
  }

  const timeInput = (i: number, k: 'start_time' | 'end_time') => (
    <input type="time" aria-label={`${shifts[i].code} ${k}`} className="h-10 w-28 rounded-lg border border-[#D9D6D0] bg-white px-2 text-sm"
      value={shifts[i][k].slice(0, 5)} onChange={(e) => setShifts(shifts.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
  )

  return (
    <Page title={t('set.title')} back="/owner">
      <Card>
        <span className="text-[15px] font-semibold">{t('set.shifts')}</span>
        {shifts.map((x, i) => <Row key={x.code}><span className="font-semibold">{t('clock.shift')} {x.code}</span><span className="flex items-center gap-1.5">{timeInput(i, 'start_time')}–{timeInput(i, 'end_time')}</span></Row>)}
        <Button small onClick={() => {
          const code = String.fromCharCode(65 + shifts.length)
          setShifts([...shifts, { code, start_time: '12:00', end_time: '20:00', sort: shifts.length + 1 }])
        }}>{t('set.add_shift')}</Button>
      </Card>
      <Card>
        <span className="text-[15px] font-semibold">{t('set.pay')}</span>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label={t('set.grace')}><input className={inputCls} inputMode="numeric" value={s.grace} onChange={(e) => set('grace', e.target.value)} /></Field>
          <Field label={t('set.deduct')}><input className={inputCls} inputMode="decimal" value={s.deduct} onChange={(e) => set('deduct', e.target.value)} /></Field>
          <Field label={t('set.ot')}><input className={inputCls} inputMode="decimal" value={s.ot} onChange={(e) => set('ot', e.target.value)} /></Field>
        </div>
        <span className="text-xs text-muted">{t('set.wage_note')}</span>
      </Card>
      <Card>
        <span className="text-[15px] font-semibold">{t('set.leave')}</span>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t('set.sick_days')}><input className={inputCls} inputMode="numeric" value={s.sick_days} onChange={(e) => set('sick_days', e.target.value)} /></Field>
          <Field label={t('set.personal_days')}><input className={inputCls} inputMode="numeric" value={s.personal_days} onChange={(e) => set('personal_days', e.target.value)} /></Field>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#1C1B19]" checked={!!s.sick_paid} onChange={(e) => set('sick_paid', e.target.checked ? '1' : '')} />{t('set.sick_paid')}</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#1C1B19]" checked={!!s.personal_paid} onChange={(e) => set('personal_paid', e.target.checked ? '1' : '')} />{t('set.personal_paid')}</label>
      </Card>
      <Card>
        <span className="text-[15px] font-semibold">{t('set.shop')}</span>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label="Lat"><input className={inputCls} inputMode="decimal" value={s.lat} onChange={(e) => set('lat', e.target.value)} /></Field>
          <Field label="Lng"><input className={inputCls} inputMode="decimal" value={s.lng} onChange={(e) => set('lng', e.target.value)} /></Field>
          <Field label={t('set.radius')}><input className={inputCls} inputMode="numeric" value={s.radius} onChange={(e) => set('radius', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label={t('set.tolerance')}><input className={inputCls} inputMode="decimal" value={s.tolerance} onChange={(e) => set('tolerance', e.target.value)} /></Field>
          <Field label={t('set.max_kegs')}><input className={inputCls} inputMode="numeric" value={s.max_kegs} onChange={(e) => set('max_kegs', e.target.value)} /></Field>
          <Field label={t('set.max_days')}><input className={inputCls} inputMode="numeric" value={s.max_days} onChange={(e) => set('max_days', e.target.value)} /></Field>
        </div>
        <Field label={t('set.glasses')}><input className={inputCls} value={s.glasses} onChange={(e) => set('glasses', e.target.value)} /></Field>
      </Card>
      <Msg msg={msg} />
      <Button variant="primary" disabled={busy} onClick={save}>{t('common.save')}</Button>
      <Card>
        <span className="text-[15px] font-semibold">{t('gs.title')}</span>
        <span className="text-xs text-muted">{t('gs.body')}</span>
        {gUrl && <a href={gUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-sm font-semibold underline">{t('gs.open')}</a>}
        <Msg msg={gMsg} />
        <Button disabled={gBusy} onClick={async () => {
          setGBusy(true); setGMsg(null)
          const r = await backupNow()
          setGMsg(r.ok ? { ok: true, text: t('gs.done') } : { ok: false, text: r.detail === 'google_not_connected' ? t('gs.not_connected') : t('gs.failed') })
          if (r.sheet_url) setGUrl(r.sheet_url)
          setGBusy(false)
        }}>{gBusy ? t('gs.working') : t('gs.now')}</Button>
      </Card>
    </Page>
  )
}
