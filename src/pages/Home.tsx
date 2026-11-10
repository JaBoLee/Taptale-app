import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, fmtTime, ymd, pickName, fmtNum, loadShiftTypes, type ShiftType } from '../lib/db'
import { useStockData, menuAvailable, needList } from '../lib/stock'
import LangSwitch from '../components/LangSwitch'
import InstallApp from '../components/InstallApp'
import { Button, Card, LinkButton, Msg, Pill, Row } from '../components/ui'

interface Att { kind: 'in' | 'out'; at: string; distance_m: number }

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }))
}

function ClockCard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [today, setToday] = useState<Att[]>([])
  const [shift, setShift] = useState<ShiftType | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    const start = new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    const [{ data: att }, types, { data: asg }] = await Promise.all([
      sb.from('attendance').select('kind, at, distance_m').eq('profile_id', profile.id).gte('at', start).order('at'),
      loadShiftTypes(),
      sb.from('shift_assignments').select('shift_code, status').eq('profile_id', profile.id).eq('work_date', ymd()).maybeSingle(),
    ])
    setToday((att as Att[]) ?? [])
    const a = asg as { shift_code: string | null; status: string } | null
    setShift(a?.status === 'work' ? types.find((s) => s.code === a.shift_code) ?? null : null)
  }, [profile])
  useEffect(() => { load() }, [load])

  const last = today[today.length - 1]
  const nextKind: 'in' | 'out' = last?.kind === 'in' ? 'out' : 'in'

  const clock = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const pos = await getPosition()
      const { error } = await sb.rpc('clock', { p_kind: nextKind, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude })
      if (error) {
        const m = error.message.match(/outside radius: (\d+)/)
        setMsg({ ok: false, text: m ? t('clock.too_far', { m: m[1] }) : error.message.includes('location not set') ? t('clock.no_shop') : t('clock.failed') })
      } else {
        setMsg({ ok: true, text: nextKind === 'in' ? t('clock.done_in') : t('clock.done_out') })
        load()
      }
    } catch {
      setMsg({ ok: false, text: t('clock.no_gps') })
    }
    setBusy(false)
  }

  return (
    <Card>
      <Row>
        <span className="text-muted">{t('clock.today')}</span>
        <span className="font-semibold">{shift ? `${t('clock.shift')} ${shift.code} · ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}` : t('clock.no_shift')}</span>
      </Row>
      <span className="text-[20px] font-bold">
        {last ? (last.kind === 'in' ? t('clock.in_at', { time: fmtTime(last.at) }) : t('clock.out_at', { time: fmtTime(last.at) })) : t('clock.not_yet')}
      </span>
      <Msg msg={msg} />
      <Button variant="primary" disabled={busy} onClick={clock}>
        {busy ? t('clock.locating') : nextKind === 'in' ? t('clock.clock_in') : t('clock.clock_out')}
      </Button>
      <span className="text-xs text-muted">{t('clock.gps_note')}</span>
    </Card>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()
  const { data } = useStockData()
  const [pending, setPending] = useState(0)
  const [emptyKegs, setEmptyKegs] = useState(0)
  const isOwner = profile?.role === 'owner' && profile.active

  useEffect(() => {
    if (!profile?.active) return
    sb.from('kegs').select('id', { count: 'exact', head: true }).eq('status', 'empty').then(({ count }) => setEmptyKegs(count ?? 0))
    if (isOwner) {
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('active', false).is('approved_at', null)
        .then(({ count }) => setPending(count ?? 0))
    }
  }, [profile, isOwner])

  const header = (
    <header className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-[13px] text-muted">Tap&amp;Tale</span>
        <span className="text-[22px] font-bold">{profile ? t('home.hello', { name: profile.display_name }) : 'Tap&Tale'}</span>
      </div>
      <LangSwitch />
    </header>
  )

  if (!profile || !profile.active) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-5">
        {header}
        <Card>
          <span className="text-[15px] font-semibold">
            {!profile ? t('home.no_profile') : profile.approved_at ? t('home.disabled_title') : t('home.pending_title')}
          </span>
          {profile && <p className="text-sm text-muted">{profile.approved_at ? t('home.disabled_body') : t('home.pending_body')}</p>}
        </Card>
        <Button onClick={signOut}>{t('home.logout')}</Button>
      </main>
    )
  }

  const unavailable = data ? data.menus.filter((m) => m.active && !menuAvailable(data, m)) : []
  const market = data?.suppliers.find((s) => s.kind === 'market')
  const marketList = data && market ? needList(data, market.id) : []

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-28 pt-5">
      {header}
      <InstallApp />
      <ClockCard />

      <div className="grid grid-cols-3 gap-2">
        <LinkButton to="/shift-close" className="text-sm">{t('home.q_close')}</LinkButton>
        <LinkButton to="/receipt" className="text-sm">{t('home.q_receipt')}</LinkButton>
        <LinkButton to="/stock/waste" className="text-sm">{t('home.q_waste')}</LinkButton>
      </div>

      {isOwner && pending > 0 && (
        <Link to="/users" className="flex items-center justify-between gap-3 rounded-[14px] border border-[#E3C9A4] bg-warnbg p-4 text-warn">
          <span className="text-sm font-semibold">{t('home.pending_owner', { count: pending })}</span>
          <span className="text-sm font-semibold">{t('home.review')}</span>
        </Link>
      )}

      {unavailable.length > 0 && (
        <Card tone="bad">
          <Row><span className="text-[15px] font-semibold">{t('home.unavailable')}</span><Pill tone="bad">{unavailable.length}</Pill></Row>
          {unavailable.map((m) => <Link key={m.id} to="/recipes" className="text-sm">{pickName(m)}</Link>)}
        </Card>
      )}

      {marketList.length > 0 && (
        <Card tone="warn">
          <Row><span className="text-[15px] font-semibold">{t('home.market')}</span><Pill tone="warn">{marketList.length}</Pill></Row>
          {marketList.map((n) => (
            <Row key={n.item.id}><span>{pickName(n.item)}</span><span className="text-muted">{fmtNum(n.short)} {n.item.count_unit}</span></Row>
          ))}
          <LinkButton to="/stock?tab=receive">{t('home.market_bought')}</LinkButton>
        </Card>
      )}

      {emptyKegs > 0 && (
        <Link to="/kegs" className="flex items-center justify-between rounded-[14px] border border-line bg-white p-4">
          <span className="text-[15px] font-semibold">{t('home.empty_kegs', { count: emptyKegs })}</span>
          <span className="text-sm font-semibold">{t('home.view')}</span>
        </Link>
      )}

      {isOwner && <LinkButton to="/owner" variant="primary">{t('home.owner_menu')}</LinkButton>}
      <Button onClick={signOut}>{t('home.logout')}</Button>
    </main>
  )
}
