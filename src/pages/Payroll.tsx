import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sb, ymd, fmtMoney, fmtNum, fmtDateTime, shiftWindow, loadSettings, loadShiftTypes, downloadCsv, type Settings, type ShiftType } from '../lib/db'
import { Button, Card, Empty, Loading, Page, Row } from '../components/ui'

interface Prof { id: string; display_name: string; role: string; wage_per_shift: number; active: boolean }
interface Att { profile_id: string; kind: 'in' | 'out'; at: string }
interface Asg { profile_id: string; work_date: string; shift_code: string | null; status: string }
interface Leave { profile_id: string; leave_type: 'sick' | 'personal'; leave_date: string }

export interface PayLine {
  p: Prof; worked: number; extra: number; lateMin: number; otMin: number; sick: number; personal: number; absent: number
  base: number; leavePay: number; deduct: number; ot: number; total: number
}

export function computePayroll(month: string, profs: Prof[], att: Att[], asg: Asg[], leaves: Leave[], types: ShiftType[], s: Partial<Settings>): PayLine[] {
  const late = s.late_rules ?? { grace_min: 0, deduct_per_min: 0, ot_per_min: 0 }
  const lr = s.leave_rules ?? { sick_days: 0, sick_paid: true, personal_days: 0, personal_paid: false }
  const now = new Date()
  return profs.map((p) => {
    const myAtt = att.filter((a) => a.profile_id === p.id).map((a) => ({ ...a, t: new Date(a.at) }))
    const used = new Set<number>()
    let worked = 0, lateMin = 0, otMin = 0, absent = 0
    for (const a of asg.filter((x) => x.profile_id === p.id && x.status === 'work' && x.shift_code && x.work_date.startsWith(month))) {
      const st = types.find((x) => x.code === a.shift_code)
      if (!st) continue
      const w = shiftWindow(a.work_date, st.start_time, st.end_time)
      const ins = myAtt.filter((x, i) => x.kind === 'in' && !used.has(i) && x.t.getTime() >= w.start.getTime() - 3 * 3600e3 && x.t <= w.end)
      if (!ins.length) { if (w.end < now) absent++; continue }
      const first = ins[0]
      used.add(myAtt.indexOf(first))
      worked++
      lateMin += Math.max(0, Math.round((first.t.getTime() - w.start.getTime()) / 60000) - late.grace_min)
      const outs = myAtt.filter((x) => x.kind === 'out' && x.t >= w.start && x.t.getTime() <= w.end.getTime() + 8 * 3600e3)
      const lastOut = outs[outs.length - 1]
      if (lastOut) otMin += Math.max(0, Math.round((lastOut.t.getTime() - w.end.getTime()) / 60000))
    }
    // ลงเวลาเข้าในวันที่ไม่มีกะในตาราง นับเป็นกะเพิ่ม (ไม่คิดสาย)
    const extraDays = new Set(myAtt.filter((x, i) => x.kind === 'in' && !used.has(i)).map((x) => ymd(x.t)))
    const extra = extraDays.size
    const myLeaves = leaves.filter((l) => l.profile_id === p.id && l.leave_date.startsWith(month))
    const sick = myLeaves.filter((l) => l.leave_type === 'sick').length
    const personal = myLeaves.filter((l) => l.leave_type === 'personal').length
    const wage = Number(p.wage_per_shift) || 0
    const base = wage * (worked + extra)
    const leavePay = wage * ((lr.sick_paid ? sick : 0) + (lr.personal_paid ? personal : 0))
    const deduct = lateMin * late.deduct_per_min
    const ot = otMin * late.ot_per_min
    return { p, worked, extra, lateMin, otMin, sick, personal, absent, base, leavePay, deduct, ot, total: base + leavePay - deduct + ot }
  })
}

export default function Payroll() {
  const { t } = useTranslation()
  const [month, setMonth] = useState(ymd().slice(0, 7))
  const [lines, setLines] = useState<PayLine[] | null>(null)
  const [raw, setRaw] = useState<{ att: Att[]; profs: Prof[] }>({ att: [], profs: [] })
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLines(null)
    const from = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const to = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    const [{ data: profs }, { data: att }, { data: asg }, { data: lv }, types, s] = await Promise.all([
      sb.from('profiles').select('id, display_name, role, wage_per_shift, active').eq('active', true).order('display_name'),
      sb.from('attendance').select('profile_id, kind, at').gte('at', `${from}T00:00:00+07:00`).lt('at', `${to}T12:00:00+07:00`).order('at'),
      sb.from('shift_assignments').select('profile_id, work_date, shift_code, status').gte('work_date', from).lt('work_date', to),
      sb.from('leave_requests').select('profile_id, leave_type, leave_date').eq('status', 'approved').gte('leave_date', from).lt('leave_date', to),
      loadShiftTypes(), loadSettings(),
    ])
    const P = (profs as Prof[]) ?? []
    const A = (att as Att[]) ?? []
    setRaw({ att: A, profs: P })
    setLines(computePayroll(month, P, A, (asg as Asg[]) ?? [], (lv as Leave[]) ?? [], types, s).filter((l) => l.p.wage_per_shift > 0 || l.worked || l.extra))
  }, [month])
  useEffect(() => { load() }, [load])

  const exportCsv = () => {
    if (!lines) return
    downloadCsv(`taptale-payroll-${month}.csv`, [
      ['name', 'shifts', 'extra_shifts', 'absent', 'late_min', 'ot_min', 'sick_days', 'personal_days', 'base', 'paid_leave', 'late_deduction', 'ot_pay', 'total'],
      ...lines.map((l) => [l.p.display_name, l.worked, l.extra, l.absent, l.lateMin, l.otMin, l.sick, l.personal, l.base, l.leavePay, l.deduct, l.ot, l.total]),
    ])
  }
  const exportAtt = () => downloadCsv(`taptale-attendance-${month}.csv`, [
    ['name', 'type', 'time'], ...raw.att.map((a) => [raw.profs.find((p) => p.id === a.profile_id)?.display_name ?? a.profile_id, a.kind, fmtDateTime(a.at)]),
  ])

  return (
    <Page title={t('pay.title')} back="/owner" right={<input type="month" aria-label={t('acct.month')} className="h-10 rounded-lg border border-line bg-white px-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} />}>
      {!lines ? <Loading /> : (
        <>
          <Row><span className="text-muted">{t('pay.total_all')}</span><b className="text-lg">{fmtMoney(lines.reduce((s, l) => s + l.total, 0))}</b></Row>
          {lines.length === 0 && <Empty>{t('pay.none')}</Empty>}
          {lines.map((l) => (
            <Card key={l.p.id}>
              <button type="button" className="flex min-h-11 items-center justify-between text-left" aria-expanded={open === l.p.id} onClick={() => setOpen(open === l.p.id ? null : l.p.id)}>
                <span className="text-[15px] font-semibold">{l.p.display_name}</span><b>{fmtMoney(l.total)}</b>
              </button>
              <Row className="text-muted"><span>{t('pay.base', { n: l.worked + l.extra, wage: fmtMoney(l.p.wage_per_shift) })}</span><span>{fmtMoney(l.base)}</span></Row>
              {open === l.p.id && (
                <>
                  {l.extra > 0 && <Row className="text-muted"><span>{t('pay.extra', { n: l.extra })}</span><span /></Row>}
                  <Row className="text-ok"><span>{t('pay.ot', { n: l.otMin })}</span><span>+{fmtMoney(l.ot)}</span></Row>
                  <Row className="text-bad"><span>{t('pay.late', { n: l.lateMin })}</span><span>−{fmtMoney(l.deduct)}</span></Row>
                  <Row className="text-muted"><span>{t('pay.leave', { sick: l.sick, personal: l.personal })}</span><span>+{fmtMoney(l.leavePay)}</span></Row>
                  {l.absent > 0 && <Row className="text-bad"><span>{t('pay.absent', { n: l.absent })}</span><span>{fmtNum(0)}</span></Row>}
                </>
              )}
            </Card>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={exportAtt}>{t('pay.export_att')}</Button>
            <Button variant="primary" onClick={exportCsv}>{t('pay.export')}</Button>
          </div>
          <span className="text-xs text-muted">{t('pay.rules_note')}</span>
        </>
      )}
    </Page>
  )
}
