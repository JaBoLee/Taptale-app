import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sb, fmtDate, fmtNum, loadSettings, ymd } from '../lib/db'
import { expectedGlasses, type Keg } from './Kegs'
import { Button, Card, Empty, Field, Loading, Msg, Page, Pill, Row, inputCls } from '../components/ui'

interface Reading { keg_id: string; counter: number; created_at: string }

export default function EmptyKegs() {
  const { t } = useTranslation()
  const [kegs, setKegs] = useState<Keg[] | null>(null)
  const [done, setDone] = useState<Keg[]>([])
  const [finals, setFinals] = useState<Record<string, number>>({})
  const [alert, setAlert] = useState({ max_kegs: 4, max_days: 7 })
  const [sel, setSel] = useState<string[]>([])
  const [price, setPrice] = useState('')
  const [dates, setDates] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    const monthStart = ymd().slice(0, 8) + '01T00:00:00+07:00'
    const [{ data: e }, { data: d }, s] = await Promise.all([
      sb.from('kegs').select('*').eq('status', 'empty').order('emptied_at'),
      sb.from('kegs').select('*').in('status', ['empty', 'cleared']).gte('emptied_at', monthStart).order('emptied_at', { ascending: false }),
      loadSettings(),
    ])
    setKegs((e as Keg[]) ?? [])
    const doneList = (d as Keg[]) ?? []
    setDone(doneList)
    if (s.empty_keg_alert) setAlert(s.empty_keg_alert)
    if (doneList.length) {
      const { data: rd } = await sb.from('keg_readings').select('keg_id, counter, created_at').in('keg_id', doneList.map((k) => k.id)).order('created_at', { ascending: false })
      const f: Record<string, number> = {}
      for (const r of (rd as Reading[]) ?? []) if (f[r.keg_id] == null) f[r.keg_id] = r.counter
      setFinals(f)
    }
    setSel([])
  }, [])
  useEffect(() => { load() }, [load])

  if (!kegs) return <Page title={t('empty.title')} back="/owner"><Loading /></Page>
  const pet = kegs.filter((k) => k.keg_type === 'pet')
  const steel = kegs.filter((k) => k.keg_type === 'steel')
  const brands = Array.from(new Set(steel.map((k) => k.brand)))
  const age = (k: Keg) => Math.floor((Date.now() - new Date(k.emptied_at ?? k.received_at).getTime()) / 86400000)
  const oldest = kegs.reduce((m, k) => Math.max(m, age(k)), 0)
  const overLimit = kegs.length > alert.max_kegs || oldest > alert.max_days

  const clearPet = async (how: 'donated' | 'sold') => {
    if (!sel.length) return
    setBusy(true)
    const amount = how === 'sold' ? Number(price) || 0 : null
    const { error } = await sb.from('kegs').update({ status: 'cleared', cleared_at: new Date().toISOString(), cleared_how: how,
      sale_amount: amount != null ? amount / sel.length : null }).in('id', sel)
    if (!error && how === 'sold' && amount) {
      await sb.from('ledger').insert({ entry_date: ymd(), direction: 'income', amount, category: 'keg_sale', source: 'keg_sale',
        description: t('empty.sale_desc', { n: sel.length }) })
    }
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('empty.cleared') })
    setPrice(''); await load(); setBusy(false)
  }

  const steelUpdate = async (brand: string, patch: Partial<Keg>) => {
    setBusy(true)
    const ids = steel.filter((k) => k.brand === brand).map((k) => k.id)
    const { error } = await sb.from('kegs').update(patch).in('id', ids)
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('common.saved') })
    await load(); setBusy(false)
  }

  return (
    <Page title={t('empty.title')} subtitle={t('empty.subtitle')} back="/owner">
      {overLimit && kegs.length > 0 && (
        <p role="alert" className="rounded-xl border border-badline bg-badbg px-3.5 py-3 text-sm text-bad">
          {t('empty.alert', { n: kegs.length, max: alert.max_kegs, days: oldest })}
        </p>
      )}
      <Msg msg={msg} />

      <Card>
        <Row><span className="text-base font-bold">{t('empty.pet')}</span><Pill>{t('empty.pet_wait', { n: pet.length })}</Pill></Row>
        {pet.length === 0 && <span className="text-sm text-muted">{t('common.none')}</span>}
        {pet.map((k) => (
          <label key={k.id} className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-amberink" checked={sel.includes(k.id)}
              onChange={(e) => setSel(e.target.checked ? [...sel, k.id] : sel.filter((x) => x !== k.id))} />
            <span className="flex-1">{k.beer_name} {fmtNum(k.size_l)} L</span>
            <span className="text-xs text-muted">{t('empty.emptied', { d: fmtDate(k.emptied_at) })}</span>
          </label>
        ))}
        {pet.length > 0 && (
          <>
            <Field label={t('empty.price')}><input className={inputCls} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={busy || !sel.length} onClick={() => clearPet('donated')}>{t('empty.donated')}</Button>
              <Button variant="primary" disabled={busy || !sel.length} onClick={() => clearPet('sold')}>{t('empty.sold')}</Button>
            </div>
            <span className="text-xs text-muted">{t('empty.sold_note')}</span>
          </>
        )}
      </Card>

      <Card>
        <Row><span className="text-base font-bold">{t('empty.steel')}</span><Pill>{t('empty.steel_wait', { n: steel.length })}</Pill></Row>
        {brands.length === 0 && <span className="text-sm text-muted">{t('common.none')}</span>}
        {brands.map((b) => {
          const list = steel.filter((k) => k.brand === b)
          const st = list[0].return_status
          const days = Math.max(...list.map(age))
          return (
            <div key={b} className="flex flex-col gap-2 border-t border-line pt-2.5">
              <Row>
                <span className="font-semibold">{b} · {t('empty.kegs_n', { n: list.length })}</span>
                {st === 'scheduled' ? <Pill tone="warn">{t('empty.scheduled', { d: fmtDate(list[0].return_date) })}</Pill>
                  : st === 'notified' ? <Pill tone="warn">{t('empty.notified')}</Pill>
                  : <Pill tone={days > alert.max_days ? 'bad' : 'mute'}>{t('empty.waiting_days', { n: days })}</Pill>}
              </Row>
              <span className="text-xs text-muted">{list.map((k) => `${k.beer_name} ${fmtNum(k.size_l)}L`).join(' · ')}</span>
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <Field label={t('empty.pickup_date')}>
                  <input type="date" className={inputCls} value={dates[b] ?? list[0].return_date ?? ''} onChange={(e) => setDates({ ...dates, [b]: e.target.value })} />
                </Field>
                <Button small disabled={busy || !dates[b]} onClick={() => steelUpdate(b, { return_status: 'scheduled', return_date: dates[b] })}>{t('empty.set_date')}</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={busy} onClick={() => steelUpdate(b, { return_status: 'notified' })}>{t('empty.mark_notified')}</Button>
                <Button variant="primary" disabled={busy}
                  onClick={() => steelUpdate(b, { status: 'cleared', cleared_how: 'returned', cleared_at: new Date().toISOString() })}>{t('empty.returned')}</Button>
              </div>
            </div>
          )
        })}
      </Card>

      <Card>
        <Row><span className="text-[15px] font-semibold">{t('empty.yield_title')}</span><span className="text-xs text-muted">{t('empty.yield_hint')}</span></Row>
        {done.length === 0 && <Empty>{t('common.none')}</Empty>}
        {done.map((k) => {
          const exp = expectedGlasses(k)
          const sold = finals[k.id] ?? 0
          const y = exp ? Math.round((sold / exp) * 100) : 0
          return (
            <div key={k.id} className="flex flex-col gap-1">
              <Row><span>{k.beer_name} · {fmtNum(k.size_l)} L</span><span className="font-semibold">{y}% ({sold}/{exp})</span></Row>
              <div className="h-1.5 overflow-hidden rounded bg-sand"><div className={`h-1.5 ${y < 88 ? 'bg-warn' : 'bg-ok'}`} style={{ width: `${Math.min(y, 100)}%` }} /></div>
            </div>
          )
        })}
      </Card>
    </Page>
  )
}
