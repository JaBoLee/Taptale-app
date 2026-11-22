import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sb, ymd, addDays, fmtMoney, fmtDateTime, fmtTime, loadSettings, loadMembers } from '../lib/db'
import { Card, Page, Pill, Row } from '../components/ui'

interface Close { id: string; profile_id: string; work_date: string; shift_code: string | null; bill_count: number | null; bill_total: number | null; cash_open: number; cash_close: number; closed_at: string }
interface Move { direction: 'in' | 'out'; amount: number; reason: string; created_at: string }
interface Issue { cur: Close; prev: Close; diff: number; moves: Move[] }
interface PayFix { id: string; work_date: string; shift_code: string | null; bill_no: string | null; amount: number; recorded_as: string; actual: string; note: string | null; created_by: string; created_at: string }

export default function OwnerHome() {
  const { t } = useTranslation()
  const [issues, setIssues] = useState<Issue[]>([])
  const [inside, setInside] = useState<{ name: string; at: string }[]>([])
  const [counts, setCounts] = useState({ receipts: 0, leaves: 0, pending: 0, closes: 0, sales: 0 })
  const [names, setNames] = useState<Record<string, string>>({})
  const [fixes, setFixes] = useState<PayFix[]>([])

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
        if (Math.abs(diff) > tol) iss.push({ cur: C[i], prev: C[i - 1], diff, moves: M.filter((m) => m.created_at > C[i - 1].closed_at && m.created_at <= C[i].closed_at) })
      }
      setIssues(iss.reverse())
      const last: Record<string, { kind: string; at: string }> = {}
      for (const a of (att as { profile_id: string; kind: string; at: string }[]) ?? []) last[a.profile_id] = a
      setInside(Object.entries(last).filter(([, v]) => v.kind === 'in').map(([id, v]) => ({ name: nm[id] ?? '–', at: v.at })))
      const today = C.filter((c) => c.work_date === ymd())
      setCounts({ receipts: r.count ?? 0, leaves: l.count ?? 0, pending: p.count ?? 0, closes: today.length, sales: today.reduce((s2, c) => s2 + (Number(c.bill_total) || 0), 0) })
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
        <div className="flex flex-col gap-1 rounded-[18px] bg-ink p-3.5 text-white">
          <span className="text-xs text-herosub">{t('owner.kpi_sales')}</span>
          <span className="text-[22px] font-bold text-amber">{fmtMoney(counts.sales)}</span>
          <span className="text-xs text-herosub">{t('owner.today_closes', { n: counts.closes })}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[18px] bg-tealbg p-3.5 text-tealink">
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
