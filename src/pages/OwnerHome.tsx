import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sb, ymd, addDays, fmtMoney, fmtDateTime, fmtTime, loadSettings, loadMembers } from '../lib/db'
import { Card, Page, Pill, Row } from '../components/ui'

interface Close { id: string; profile_id: string; work_date: string; shift_code: string | null; bill_count: number | null; bill_total: number | null; cash_open: number; cash_close: number; closed_at: string; cash_reviewed_at?: string | null }
interface Move { direction: 'in' | 'out'; amount: number; reason: string; created_at: string }
interface Issue { cur: Close; prev: Close; diff: number; moves: Move[] }
interface PayFix { id: string; work_date: string; shift_code: string | null; bill_no: string | null; amount: number; recorded_as: string; actual: string; note: string | null; created_by: string; created_at: string }

export default function OwnerHome() {
  const { t } = useTranslation()
  const [issues, setIssues] = useState<Issue[]>([])
  const [inside, setInside] = useState<{ name: string; at: string }[]>([])
  const [counts, setCounts] = useState({ receipts: 0, leaves: 0, pending: 0 })
  const [names, setNames] = useState<Record<string, string>>({})
  const [fixes, setFixes] = useState<PayFix[]>([])
  const [range, setRange] = useState(() => ({ from: ymd(), to: ymd() }))
  const [sales, setSales] = useState<{ total: number; closes: number; bills: number } | null>(null)
  const [review, setReview] = useState<{ id: string; note: string; err?: boolean } | null>(null)
  const markReviewed = async () => {
    if (!review) return
    const { data: u } = await sb.auth.getUser()
    const { error } = await sb.from('shift_closes').update({ cash_reviewed_at: new Date().toISOString(), cash_reviewed_by: u.user?.id ?? null, cash_review_note: review.note.trim() || null }).eq('id', review.id)
    if (!error) { setIssues((xs) => xs.filter((x) => x.cur.id !== review.id)); setReview(null) } else setReview({ ...review, err: true })
  }

  useEffect(() => {
    const from = range.from <= range.to ? range.from : range.to
    const to = range.from <= range.to ? range.to : range.from
    setSales(null)
    sb.from('shift_closes').select('bill_total, bill_count').gte('work_date', from).lte('work_date', to).then(({ data }) => {
      const rows = (data as { bill_total: number | null; bill_count: number | null }[]) ?? []
      setSales({ total: rows.reduce((a, c) => a + (Number(c.bill_total) || 0), 0), closes: rows.length,
        bills: rows.reduce((a, c) => a + (Number(c.bill_count) || 0), 0) })
    })
  }, [range])

  const today = ymd()
  const monthStart = today.slice(0, 8) + '01'
  const presets = [
    { k: 'today', from: today, to: today },
    { k: 'yesterday', from: addDays(today, -1), to: addDays(today, -1) },
    { k: 'd7', from: addDays(today, -6), to: today },
    { k: 'month', from: monthStart, to: today },
  ]

  useEffect(() => {
    (async () => {
      const since = addDays(ymd(), -14)
      const [{ data: closes }, { data: moves }, s, members, { data: att }, r, l, p, fx] = await Promise.all([
        sb.from('shift_closes').select('*').gte('work_date', since).order('closed_at'),
        sb.from('cash_movements').select('direction, amount, reason, created_at').gte('created_at', since + 'T00:00:00+07:00'),
        loadSettings(), loadMembers(),
        sb.from('attendance').select('profile_id, kind, at').gte('at', new Date(Date.now() - 16 * 3600e3).toISOString()).order('at'),
        sb.from('receipts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        sb.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('active', false).is('approved_at', null),
        sb.from('payment_fixes').select('*').gte('work_date', since).order('created_at', { ascending: false }).limit(30),
      ])
      if (!fx.error) setFixes(((fx.data as PayFix[]) ?? []).map((x) => ({ ...x, amount: Number(x.amount) })))
      const nm: Record<string, string> = {}
      for (const m of members) nm[m.id] = m.display_name
      setNames(nm)
      const tol = s.cash_tolerance?.amount ?? 0
      const C = ((closes as Close[]) ?? []).map((c) => ({ ...c, cash_open: Number(c.cash_open), cash_close: Number(c.cash_close) }))
      const M = ((moves as Move[]) ?? []).map((m) => ({ ...m, amount: Number(m.amount) }))
      const iss: Issue[] = []
      for (let i = 1; i < C.length; i++) {
        const diff = C[i].cash_open - C[i - 1].cash_close
        if (Math.abs(diff) > tol && !C[i].cash_reviewed_at) iss.push({ cur: C[i], prev: C[i - 1], diff, moves: M.filter((m) => m.created_at > C[i - 1].closed_at && m.created_at <= C[i].closed_at) })
      }
      setIssues(iss.reverse())
      const last: Record<string, { kind: string; at: string }> = {}
      for (const a of (att as { profile_id: string; kind: string; at: string }[]) ?? []) last[a.profile_id] = a
      setInside(Object.entries(last).filter(([, v]) => v.kind === 'in').map(([id, v]) => ({ name: nm[id] ?? '–', at: v.at })))
      setCounts({ receipts: r.count ?? 0, leaves: l.count ?? 0, pending: p.count ?? 0 })
    })()
  }, [])

  const links = [
    { to: '/team', label: t('owner.l_team') }, { to: '/payroll', label: t('owner.l_payroll') }, { to: '/users', label: t('owner.l_users') },
    { to: '/orders', label: t('owner.l_orders') }, { to: '/empty-kegs', label: t('owner.l_empty') }, { to: '/accounting', label: t('owner.l_acct') },
    { to: '/items', label: t('owner.l_items') }, { to: '/recipes', label: t('owner.l_menus') }, { to: '/settings', label: t('owner.l_settings') },
    { to: '/schedule', label: t('sched.mine') },
  ]

  return (
    <Page title={t('owner.title')}>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2 flex flex-col gap-2 rounded-[18px] bg-ink p-3.5 text-white">
          <span className="text-xs text-herosub">{range.from === today && range.to === today ? t('owner.kpi_sales') : t('owner.sales_range')}</span>
          <span className="text-[26px] font-bold text-amber">{sales ? fmtMoney(sales.total) : '…'}</span>
          <span className="text-xs text-herosub">{t('owner.sales_meta', { n: sales?.closes ?? 0, b: sales?.bills ?? 0 })}</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-herosub">{t('owner.from')}
              <input type="date" className="h-11 rounded-xl bg-paper px-2.5 text-sm font-semibold text-ink" value={range.from} max={today} onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} /></label>
            <label className="flex flex-col gap-1 text-xs text-herosub">{t('owner.to')}
              <input type="date" className="h-11 rounded-xl bg-paper px-2.5 text-sm font-semibold text-ink" value={range.to} max={today} onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} /></label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const on = range.from === p.from && range.to === p.to
              return <button key={p.k} type="button" aria-pressed={on} onClick={() => setRange({ from: p.from, to: p.to })}
                className={`min-h-11 rounded-xl px-3 text-xs font-semibold ${on ? 'bg-amber text-ink' : 'bg-white/10 text-white'}`}>{t(`owner.r_${p.k}`)}</button>
            })}
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1 rounded-[18px] bg-tealbg p-3.5 text-tealink">
          <span className="text-xs">{t('owner.inside')}</span>
          <span className="text-[22px] font-bold">{inside.length}</span>
          <span className="truncate text-xs">{inside.map((x) => x.name).join(', ') || t('owner.nobody')}</span>
        </div>
      </div>
      {(counts.pending > 0 || counts.leaves > 0 || counts.receipts > 0) && (
        <Card tone="warn">
          <span className="text-[15px] font-semibold">{t('owner.todo')}</span>
          {counts.pending > 0 && <Link to="/users" className="flex min-h-10 items-center justify-between text-sm"><span>{t('owner.t_pending', { n: counts.pending })}</span><b>›</b></Link>}
          {counts.leaves > 0 && <Link to="/team" className="flex min-h-10 items-center justify-between text-sm"><span>{t('owner.t_leaves', { n: counts.leaves })}</span><b>›</b></Link>}
          {counts.receipts > 0 && <Link to="/accounting" className="flex min-h-10 items-center justify-between text-sm"><span>{t('owner.t_receipts', { n: counts.receipts })}</span><b>›</b></Link>}
        </Card>
      )}

      {issues.length > 0 && (
        <Card tone="bad">
          <Row><span className="text-[15px] font-bold text-bad">{t('owner.cash_issues', { n: issues.length })}</span><span className="rounded-full bg-bad px-2.5 py-0.5 text-xs font-bold text-white">{t('owner.only_owner')}</span></Row>
          {issues.slice(0, 5).map((x) => (
            <div key={x.cur.id} className="flex flex-col gap-0.5 border-t border-badline pt-2 text-sm">
              <Row><span>{t('owner.cash_line', { prev: names[x.prev.profile_id] ?? '–', cur: names[x.cur.profile_id] ?? '–' })}</span><b className="text-bad">{x.diff > 0 ? '+' : ''}{fmtMoney(x.diff)}</b></Row>
              <span className="text-xs text-muted">{t('owner.cash_detail', { close: fmtMoney(x.prev.cash_close), open: fmtMoney(x.cur.cash_open), when: fmtDateTime(x.cur.closed_at) })}</span>
              {x.moves.length > 0 && <span className="text-xs text-muted">{t('owner.cash_moves', { list: x.moves.map((m) => `${m.direction === 'out' ? '−' : '+'}${fmtMoney(m.amount)}`).join(', ') })}</span>}
              {review?.id === x.cur.id ? (
                <div className="mt-1 flex flex-col gap-1.5">
                  <input className="h-11 rounded-xl border-[1.5px] border-edge bg-white px-3 text-sm" placeholder={t('owner.cash_review_note')} value={review.note} onChange={(e) => setReview({ ...review, note: e.target.value })} />
                  {review.err && <span className="text-xs font-semibold text-bad">{t('common.save_failed')}</span>}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" className="min-h-11 rounded-xl border-[1.5px] border-edge bg-white text-sm font-semibold" onClick={() => setReview(null)}>{t('common.cancel')}</button>
                    <button type="button" className="min-h-11 rounded-xl bg-ink text-sm font-semibold text-white" onClick={markReviewed}>{t('owner.cash_review_ok')}</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="mt-1 min-h-11 self-start rounded-xl border-[1.5px] border-badline bg-white px-4 text-sm font-semibold text-bad" onClick={() => setReview({ id: x.cur.id, note: '' })}>✓ {t('owner.cash_review')}</button>
              )}
            </div>
          ))}
        </Card>
      )}

      {fixes.length > 0 && (
        <Card tone="warn">
          <Row><span className="text-[15px] font-bold text-amberink">{t('fix.owner_title')}</span><Pill tone="warn">{fixes.length}</Pill></Row>
          {fixes.map((x) => (
            <div key={x.id} className="flex flex-col gap-1 border-t border-warnline pt-2 text-sm">
              <Row>
                <span className="font-semibold">{x.bill_no ? `#${x.bill_no} · ` : ''}{fmtMoney(x.amount)}</span>
                <span className="flex items-center gap-1 text-xs"><Pill tone="bad">{t(`fix.p_${x.recorded_as}`)}</Pill>→<Pill tone="ok">{t(`fix.p_${x.actual}`)}</Pill></span>
              </Row>
              <span className="text-xs text-muted">{x.shift_code ? `${t('clock.shift')} ${x.shift_code} · ` : ''}{t('fix.by', { name: names[x.created_by] ?? '–', when: fmtDateTime(x.created_at) })}{x.note ? ` · ${x.note}` : ''}</span>
            </div>
          ))}
        </Card>
      )}

      {inside.length > 0 && (
        <Card>
          {inside.map((x, i) => <Row key={i}><span>{x.name}</span><Pill tone="ok">{t('owner.in_since', { time: fmtTime(x.at) })}</Pill></Row>)}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => <Link key={l.to} to={l.to} className="flex min-h-14 items-center justify-center rounded-[18px] bg-white shadow-[0_1px_0_var(--color-line)] px-3 text-center text-sm font-semibold">{l.label}</Link>)}
      </div>
      <p className="text-xs text-muted">{t('owner.integrations')}</p>
    </Page>
  )
}
