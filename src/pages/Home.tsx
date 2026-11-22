import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, fmtTime, ymd, pickName, fmtNum, loadShiftTypes, type ShiftType } from '../lib/db'
import { useStockData, menuAvailable, needList, qtyOf } from '../lib/stock'
import LangSwitch from '../components/LangSwitch'
import InstallApp from '../components/InstallApp'
import { Button, Card, LinkButton, Msg, Pill, Row } from '../components/ui'

const tileTone = {
  teal: 'bg-tealbg text-tealink',
  amber: 'bg-amberbg text-amberink',
  bad: 'bg-badbg text-bad',
  ink: 'bg-sand text-ink',
} as const

function Tile({ to, tone, label, icon }: { to: string; tone: keyof typeof tileTone; label: string; icon: ReactNode }) {
  return (
    <Link to={to} className="flex min-h-24 flex-col gap-2.5 rounded-[18px] bg-white p-3.5 text-sm font-semibold shadow-[0_1px_0_var(--color-line)]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tileTone[tone]}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
      </span>
      {label}
    </Link>
  )
}

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
    <Card tone="dark" className="gap-3 !rounded-[22px] !p-[18px]">
      <Row>
        <span className="text-herosub">{t('clock.today')}</span>
        <span className="rounded-full bg-ink2 px-2.5 py-0.5 text-xs font-bold text-amberbg">{shift ? `${t('clock.shift')} ${shift.code} · ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}` : t('clock.no_shift')}</span>
      </Row>
      <span className="text-[22px] font-bold">
        {last ? (last.kind === 'in' ? t('clock.in_at', { time: fmtTime(last.at) }) : t('clock.out_at', { time: fmtTime(last.at) })) : t('clock.not_yet')}
      </span>
      <Msg msg={msg} />
      <Button variant="primary" disabled={busy} onClick={clock}>
        {busy ? t('clock.locating') : nextKind === 'in' ? t('clock.clock_in') : t('clock.clock_out')}
      </Button>
      <span className="text-xs text-herosub">{t('clock.gps_note')}</span>
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
        <span className="text-2xl font-bold">{profile ? t('home.hello', { name: profile.display_name }) : 'Tap&Tale'}</span>
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
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-[calc(7rem+var(--badge-h,0px))] pt-5">
      {header}
      <InstallApp />
      <ClockCard />

      <div className="grid grid-cols-2 gap-2.5">
        <Tile to="/stock" tone="teal" label={t('nav.stock')} icon={<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>} />
        <Tile to="/shift-close" tone="ink" label={t('home.q_close')} icon={<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>} />
        <Tile to="/receipt" tone="amber" label={t('home.q_receipt')} icon={<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>} />
        <Tile to="/stock/waste" tone="bad" label={t('home.q_waste')} icon={<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>} />
      </div>

      {isOwner && pending > 0 && (
        <Link to="/users" className="flex min-h-12 items-center justify-between gap-3 rounded-[18px] bg-amberbg p-4 text-amberink">
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
        <Card>
          <Row><span className="text-[15px] font-bold">{t('home.market')}</span><Pill tone="warn">{marketList.length}</Pill></Row>
          {marketList.map((n) => {
            const have = data ? qtyOf(data, n.item.id) : 0
            const pct = n.item.safety_stock > 0 ? Math.min(100, Math.round((have / n.item.safety_stock) * 100)) : 0
            return (
              <div key={n.item.id} className="flex flex-col gap-1.5">
                <Row><span>{pickName(n.item)}</span><span className="font-semibold">{fmtNum(have)} / {fmtNum(n.item.safety_stock)} {n.item.count_unit}</span></Row>
                <div className="h-1.5 rounded-full bg-sand"><div className="h-1.5 rounded-full bg-amber" style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
          <LinkButton to="/stock?tab=receive">{t('home.market_bought')}</LinkButton>
        </Card>
      )}

      {emptyKegs > 0 && (
        <Link to="/kegs" className="flex min-h-12 items-center justify-between rounded-[18px] bg-tealbg p-4 text-tealink">
          <span className="text-[15px] font-semibold">{t('home.empty_kegs', { count: emptyKegs })}</span>
          <span className="text-sm font-semibold">{t('home.view')}</span>
        </Link>
      )}

      {isOwner && <LinkButton to="/owner" variant="primary">{t('home.owner_menu')}</LinkButton>}
      <Button onClick={signOut}>{t('home.logout')}</Button>
    </main>
  )
}
