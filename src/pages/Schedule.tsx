import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, ymd, addDays, mondayOf, weekdayShort, fmtDate, loadShiftTypes, loadSettings, loadMembers, type ShiftType, type Member } from '../lib/db'
import { Button, Card, Field, Msg, Page, Pill, Row, inputCls } from '../components/ui'
import { ANNUAL_DAYS, LEAVE_TYPES, annualEligible, usableHolidays, type Holiday, type LeaveType } from '../lib/leave'

interface Asg { id?: string; work_date: string; profile_id: string; shift_code: string | null; status: 'work' | 'off' | 'leave'; published: boolean }
interface Leave { id: string; profile_id: string; leave_type: LeaveType; holiday_id?: string | null; leave_date: string; shift_code: string | null; reason: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string }

const week = (monday: string) => Array.from({ length: 7 }, (_, i) => addDays(monday, i))

export function MySchedule() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [monday, setMonday] = useState(mondayOf(ymd()))
  const [types, setTypes] = useState<ShiftType[]>([])
  const [asg, setAsg] = useState<Asg[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [rules, setRules] = useState({ sick_days: 0, personal_days: 0 })
  const [f, setF] = useState({ leave_type: 'sick' as LeaveType, leave_date: ymd(), shift_code: '', reason: '', holiday_id: '' })
  const [holidays, setHolidays] = useState<Holiday[] | null>(null) // null = ยังไม่มีตาราง (ก่อนรัน migration 0009)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    const days = week(monday)
    const [ty, { data: a }, { data: l }, s, hol, pay] = await Promise.all([
      loadShiftTypes(),
      sb.from('shift_assignments').select('*').eq('profile_id', profile.id).gte('work_date', days[0]).lte('work_date', days[6]),
      sb.from('leave_requests').select('*').eq('profile_id', profile.id).gte('leave_date', `${Number(ymd().slice(0, 4)) - 1}-01-01`).order('leave_date', { ascending: false }),
      loadSettings(),
      sb.from('public_holidays').select('id, holiday_date, name').gte('holiday_date', `${Number(ymd().slice(0, 4)) - 1}-01-01`).order('holiday_date'),
      sb.from('staff_pay').select('start_date').eq('profile_id', profile.id).maybeSingle(),
    ])
    setTypes(ty); setAsg((a as Asg[]) ?? []); setLeaves((l as Leave[]) ?? [])
    setHolidays(hol.error ? null : ((hol.data as Holiday[]) ?? []))
    setStartDate((pay.data as { start_date: string | null } | null)?.start_date ?? null)
    if (s.leave_rules) setRules({ sick_days: s.leave_rules.sick_days, personal_days: s.leave_rules.personal_days })
  }, [profile, monday])
  useEffect(() => { load() }, [load])

  const year = ymd().slice(0, 4)
  const used = (k: LeaveType) => leaves.filter((l) => l.leave_type === k && l.status === 'approved' && l.leave_date.startsWith(year)).length
  const annualTaken = leaves.filter((l) => l.leave_type === 'annual' && l.status !== 'rejected' && l.leave_date.startsWith(year)).length
  const canAnnual = annualEligible(startDate, ymd())
  const freeHolidays = holidays ? usableHolidays(holidays, leaves.filter((l) => l.status !== 'rejected').map((l) => l.holiday_id), ymd()) : []
  const typeOptions = holidays ? LEAVE_TYPES : (['sick', 'personal'] as const)

  const request = async () => {
    if (!profile) return
    if (f.leave_type === 'holiday') {
      const h = freeHolidays.find((x) => x.id === f.holiday_id)
      if (!h) { setMsg({ ok: false, text: t('sched.pick_holiday') }); return }
      if (f.leave_date <= h.holiday_date) { setMsg({ ok: false, text: t('sched.holiday_after', { date: fmtDate(h.holiday_date) }) }); return }
    }
    if (f.leave_type === 'annual' && (!canAnnual || annualTaken >= ANNUAL_DAYS)) { setMsg({ ok: false, text: t('sched.annual_none') }); return }
    setBusy(true)
    const { error } = await sb.from('leave_requests').insert({ profile_id: profile.id, leave_type: f.leave_type, leave_date: f.leave_date,
      shift_code: f.shift_code || null, reason: f.reason || null, ...(f.leave_type === 'holiday' ? { holiday_id: f.holiday_id } : {}) })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('sched.requested') })
    if (!error) { setF({ ...f, reason: '', holiday_id: '' }); load() }
    setBusy(false)
  }

  return (
    <Page title={t('sched.mine')}>
      <Card>
        <Row>
          <Button small onClick={() => setMonday(addDays(monday, -7))} aria-label={t('sched.prev')}>‹</Button>
          <span className="font-semibold">{fmtDate(monday)} – {fmtDate(addDays(monday, 6))}</span>
          <Button small onClick={() => setMonday(addDays(monday, 7))} aria-label={t('sched.next')}>›</Button>
        </Row>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {week(monday).map((d) => {
            const a = asg.find((x) => x.work_date === d && x.published)
            const isToday = d === ymd()
            return (
              <div key={d} className={`flex flex-col gap-1 rounded-[10px] py-2 ${isToday ? 'bg-ink text-white' : 'bg-paper'}`}>
                <span>{weekdayShort(d)}</span>
                <b className="text-sm">{!a ? '–' : a.status === 'leave' ? t('sched.leave_s') : a.status === 'off' ? t('sched.off_s') : a.shift_code}</b>
              </div>
            )
          })}
        </div>
        <span className="text-xs text-muted">{types.map((s) => `${s.code} ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`).join(' · ')}</span>
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('sched.balance')}</span>
        <Row><span>{t('sched.sick')}</span><span>{t('sched.left', { n: Math.max(rules.sick_days - used('sick'), 0), total: rules.sick_days })}</span></Row>
        <Row><span>{t('sched.personal')}</span><span>{t('sched.left', { n: Math.max(rules.personal_days - used('personal'), 0), total: rules.personal_days })}</span></Row>
        {holidays && (
          <>
            <Row><span>{t('sched.lt_holiday')}</span><span>{t('sched.holiday_left', { n: freeHolidays.length })}</span></Row>
            <Row><span>{t('sched.lt_annual')}</span><span>{canAnnual ? t('sched.left', { n: Math.max(ANNUAL_DAYS - annualTaken, 0), total: ANNUAL_DAYS }) : t('sched.annual_after_year')}</span></Row>
            <Row><span>{t('sched.lt_unpaid')}</span><span>{t('sched.unpaid_used', { n: used('unpaid') })}</span></Row>
          </>
        )}
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('sched.request')}</span>
        <div role="group" aria-label={t('sched.type')} className="flex flex-wrap gap-2">
          {typeOptions.map((k) => (
            <button key={k} type="button" aria-pressed={f.leave_type === k} onClick={() => setF({ ...f, leave_type: k })}
              className={`min-h-11 rounded-full border-[1.5px] px-4 text-[13px] font-semibold ${f.leave_type === k ? 'border-ink bg-ink text-white' : 'border-edge bg-white text-ink'}`}>{t(`sched.lt_${k}`)}</button>
          ))}
        </div>
        <span className="text-xs text-muted">{t(`sched.lt_${f.leave_type}_hint`)}</span>
        {f.leave_type === 'holiday' && (
          <Field label={t('sched.which_holiday')}>
            <select className={inputCls} value={f.holiday_id} onChange={(e) => setF({ ...f, holiday_id: e.target.value })}>
              <option value="">{freeHolidays.length ? '–' : t('sched.no_holiday')}</option>
              {freeHolidays.map((h) => <option key={h.id} value={h.id}>{fmtDate(h.holiday_date)} · {h.name}</option>)}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t('common.date')}><input type="date" className={inputCls} value={f.leave_date} onChange={(e) => setF({ ...f, leave_date: e.target.value })} /></Field>
          <Field label={t('clock.shift')}>
            <select className={inputCls} value={f.shift_code} onChange={(e) => setF({ ...f, shift_code: e.target.value })}>
              <option value="">–</option>{types.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
            </select>
          </Field>
        </div>
        <Field label={t('sched.reason')}><input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        <Msg msg={msg} />
        <Button variant="primary" disabled={busy} onClick={request}>{t('sched.send')}</Button>
      </Card>

      {leaves.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('sched.my_requests')}</span>
          {leaves.map((l) => (
            <Row key={l.id}>
              <span>{t(`sched.lt_${l.leave_type}`)} · {fmtDate(l.leave_date)}</span>
              <Pill tone={l.status === 'approved' ? 'ok' : l.status === 'rejected' ? 'bad' : 'warn'}>{t(`sched.st_${l.status}`)}</Pill>
            </Row>
          ))}
        </Card>
      )}
    </Page>
  )
}

export function Team() {
  const { t } = useTranslation()
  const [monday, setMonday] = useState(mondayOf(addDays(ymd(), 7)))
  const [types, setTypes] = useState<ShiftType[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [asg, setAsg] = useState<Asg[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const days = week(monday)

  const load = useCallback(async () => {
    const [ty, mem, { data: a }, { data: l }] = await Promise.all([
      loadShiftTypes(), loadMembers(),
      sb.from('shift_assignments').select('*').gte('work_date', days[0]).lte('work_date', days[6]),
      sb.from('leave_requests').select('*').eq('status', 'pending').order('leave_date'),
    ])
    setTypes(ty); setMembers(mem.filter((m) => m.role === 'staff')); setAsg((a as Asg[]) ?? []); setLeaves((l as Leave[]) ?? [])
  }, [days[0]]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const published = asg.length > 0 && asg.every((a) => a.published)
  const cell = (pid: string, d: string) => asg.find((a) => a.profile_id === pid && a.work_date === d)
  const cellValue = (a?: Asg) => (!a ? '' : a.status === 'work' ? a.shift_code ?? '' : a.status)

  const setCell = async (pid: string, d: string, v: string) => {
    const row: Asg = { work_date: d, profile_id: pid, shift_code: ['off', 'leave', ''].includes(v) ? null : v,
      status: v === 'off' ? 'off' : v === 'leave' ? 'leave' : 'work', published }
    if (v === '') {
      await sb.from('shift_assignments').delete().eq('profile_id', pid).eq('work_date', d)
    } else {
      const { error } = await sb.from('shift_assignments').upsert(row, { onConflict: 'work_date,profile_id' })
      if (error) { setMsg({ ok: false, text: t('common.save_failed') }); return }
    }
    load()
  }

  const copyPrev = async () => {
    setBusy(true)
    const prev = week(addDays(monday, -7))
    const { data: p } = await sb.from('shift_assignments').select('*').gte('work_date', prev[0]).lte('work_date', prev[6])
    const rows = ((p as Asg[]) ?? []).map((a) => ({ work_date: addDays(a.work_date, 7), profile_id: a.profile_id,
      shift_code: a.status === 'leave' ? null : a.shift_code, status: a.status === 'leave' ? 'work' as const : a.status, published: false }))
      .filter((r) => r.status !== 'work' || r.shift_code)
    if (rows.length) await sb.from('shift_assignments').upsert(rows, { onConflict: 'work_date,profile_id' })
    setMsg({ ok: true, text: t('sched.copied', { n: rows.length }) })
    await load(); setBusy(false)
  }

  const publish = async () => {
    setBusy(true)
    const { error } = await sb.from('shift_assignments').update({ published: true }).gte('work_date', days[0]).lte('work_date', days[6])
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('sched.published') })
    await load(); setBusy(false)
  }

  const decide = async (l: Leave, approve: boolean) => {
    setBusy(true)
    await sb.from('leave_requests').update({ status: approve ? 'approved' : 'rejected', decided_at: new Date().toISOString() }).eq('id', l.id)
    if (approve) await sb.from('shift_assignments').upsert({ work_date: l.leave_date, profile_id: l.profile_id, shift_code: null, status: 'leave', published: true }, { onConflict: 'work_date,profile_id' })
    await load(); setBusy(false)
  }

  const gaps = days.filter((d) => types.some((s) => !asg.some((a) => a.work_date === d && a.status === 'work' && a.shift_code === s.code)))
  const name = (pid: string) => members.find((m) => m.id === pid)?.display_name ?? '–'

  return (
    <Page title={t('sched.team')} back="/owner">
      <Msg msg={msg} />
      {leaves.length > 0 && (
        <Card tone="warn">
          <span className="text-[15px] font-semibold">{t('sched.leave_requests', { n: leaves.length })}</span>
          {leaves.map((l) => (
            <div key={l.id} className="flex flex-col gap-2 border-t border-line pt-2.5">
              <Row><span className="font-semibold">{name(l.profile_id)} · {t(`sched.lt_${l.leave_type}`)}</span>
                <span className="text-muted">{fmtDate(l.leave_date)}{l.shift_code ? ` · ${l.shift_code}` : ''}</span></Row>
              {l.reason && <span className="text-xs text-muted">{l.reason}</span>}
              <div className="grid grid-cols-2 gap-2">
                <Button small disabled={busy} onClick={() => decide(l, false)}>{t('sched.reject')}</Button>
                <Button small variant="primary" disabled={busy} onClick={() => decide(l, true)}>{t('sched.approve')}</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <Row>
          <Button small onClick={() => setMonday(addDays(monday, -7))} aria-label={t('sched.prev')}>‹</Button>
          <span className="font-semibold">{fmtDate(days[0])} – {fmtDate(days[6])}</span>
          <Button small onClick={() => setMonday(addDays(monday, 7))} aria-label={t('sched.next')}>›</Button>
        </Row>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-1 text-center text-xs">
            <thead><tr><th className="w-16" />{days.map((d) => <th key={d} className="font-normal text-muted">{weekdayShort(d)}<br />{d.slice(8)}</th>)}</tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <th className="truncate text-left text-[13px] font-semibold">{m.display_name}</th>
                  {days.map((d) => {
                    const a = cell(m.id, d)
                    return (
                      <td key={d}>
                        <select aria-label={`${m.display_name} ${d}`} value={cellValue(a)} onChange={(e) => setCell(m.id, d, e.target.value)}
                          className={`h-10 w-full rounded-lg border text-center text-[13px] font-semibold ${a?.status === 'leave' ? 'border-warnline bg-warnbg text-warn' : a?.status === 'off' || !a ? 'border-line bg-paper text-muted' : 'border-line bg-white'}`}>
                          <option value="">–</option>
                          {types.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
                          <option value="off">{t('sched.off_s')}</option>
                          <option value="leave">{t('sched.leave_s')}</option>
                        </select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {gaps.length > 0 && <span className="text-xs text-warn">{t('sched.gaps', { days: gaps.map(weekdayShort).join(', ') })}</span>}
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={busy} onClick={copyPrev}>{t('sched.copy_prev')}</Button>
          <Button variant="primary" disabled={busy || !asg.length} onClick={publish}>{published ? t('sched.republish') : t('sched.publish')}</Button>
        </div>
        <span className="text-xs text-muted">{published ? t('sched.is_published') : t('sched.not_published')}</span>
      </Card>
    </Page>
  )
}
