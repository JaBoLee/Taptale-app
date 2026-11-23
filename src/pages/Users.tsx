import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth, type Role } from '../lib/auth'
import PasswordInput from '../components/PasswordInput'
import { fmtMoney } from '../lib/db'
import type { StaffPay } from '../lib/leave'

interface Row {
  id: string
  username: string
  display_name: string
  role: Role
  active: boolean
  wage_per_shift: number
  approved_at: string | null
}

const input = 'h-11 w-full rounded-xl border-[1.5px] border-edge bg-field px-3 text-[15px] text-ink'
const btn = 'h-11 rounded-xl border-[1.5px] border-edge bg-field px-4 text-sm font-semibold'
const btnP = 'h-11 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60'

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase!.functions.invoke('manage-users', { body })
  if (error) {
    let code = 'failed'
    try { code = (await (error as { context?: Response }).context?.json())?.error ?? code } catch { /* ignore */ }
    return code
  }
  return (data as { error?: string })?.error ?? null
}

export default function Users() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ username: '', display_name: '', password: '', role: 'staff' as Role, wage_per_shift: '' })
  const [approveForm, setApproveForm] = useState<Record<string, { role: Role; wage: string }>>({})
  const [edit, setEdit] = useState({ display_name: '', role: 'staff' as Role, wage_per_shift: '', password: '', salary: '', ot_rate: '', start_date: '' })
  const [pay, setPay] = useState<Record<string, StaffPay> | null>(null) // null = ยังไม่มีตาราง staff_pay (ก่อนรัน migration 0009)

  const load = useCallback(async () => {
    const sp = await supabase!.from('staff_pay').select('profile_id, monthly_salary, ot_rate, start_date')
    setPay(sp.error ? null : Object.fromEntries(((sp.data as StaffPay[]) ?? []).map((x) => [x.profile_id, x])))
    const { data } = await supabase!.from('profiles').select('id, username, display_name, role, active, wage_per_shift, approved_at').order('role').order('username')
    setRows((data as Row[]) ?? [])
  }, [])
  useEffect(() => { load() }, [load])

  const report = (err: string | null, okKey: string) => {
    setMsg(err ? { ok: false, text: t(`users.err.${err}`, { defaultValue: t('users.err.failed') }) } : { ok: true, text: t(okKey) })
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await call({ action: 'create', ...form, wage_per_shift: form.wage_per_shift === '' ? null : Number(form.wage_per_shift) })
    report(err, 'users.created')
    if (!err) { setForm({ username: '', display_name: '', password: '', role: 'staff', wage_per_shift: '' }); load() }
    setBusy(false)
  }

  /** บันทึกเงินเดือน / OT ต่อชั่วโมง / วันเริ่มงาน (ตาราง staff_pay — เจ้าของเท่านั้น) */
  const savePay = async (id: string, salary: string, ot: string, start: string): Promise<string | null> => {
    const prev = pay?.[id]
    const { error } = await supabase!.from('staff_pay').upsert({
      profile_id: id,
      monthly_salary: salary === '' ? Number(prev?.monthly_salary ?? 0) : Number(salary) || 0,
      ot_rate: ot === '' ? Number(prev?.ot_rate ?? 0) : Number(ot) || 0,
      start_date: start || prev?.start_date || null,
      updated_at: new Date().toISOString(),
    })
    return error ? error.message : null
  }

  const startEdit = (r: Row) => {
    setEditing(r.id)
    const p = pay?.[r.id]
    setEdit({ display_name: r.display_name, role: r.role, wage_per_shift: String(r.wage_per_shift ?? ''), password: '',
      salary: p ? String(p.monthly_salary) : '', ot_rate: p ? String(p.ot_rate) : '', start_date: p?.start_date ?? '' })
    setMsg(null)
  }

  const save = async (r: Row) => {
    setBusy(true)
    let err = await call({ action: 'update', id: r.id, display_name: edit.display_name, role: edit.role,
      wage_per_shift: pay || edit.wage_per_shift === '' ? null : Number(edit.wage_per_shift), password: edit.password || undefined })
    if (!err && pay && edit.role === 'staff') err = await savePay(r.id, edit.salary, edit.ot_rate, edit.start_date)
    report(err, 'users.saved')
    if (!err) { setEditing(null); load() }
    setBusy(false)
  }

  const toggleActive = async (r: Row) => {
    setBusy(true)
    const err = await call({ action: 'update', id: r.id, active: !r.active })
    report(err, 'users.saved')
    if (!err) load()
    setBusy(false)
  }

  const approve = async (r: Row) => {
    const f = approveForm[r.id] ?? { role: 'staff' as Role, wage: '' }
    setBusy(true)
    let err = await call({ action: 'update', id: r.id, active: true, role: f.role, wage_per_shift: pay || f.wage === '' ? null : Number(f.wage) })
    if (!err && pay && f.role === 'staff' && f.wage !== '') err = await savePay(r.id, f.wage, '', '')
    report(err, 'users.approved')
    if (!err) load()
    setBusy(false)
  }

  const reject = async (r: Row) => {
    setBusy(true)
    const err = await call({ action: 'reject', id: r.id })
    report(err, 'users.rejected')
    if (!err) load()
    setBusy(false)
  }

  const pendingRows = rows.filter((r) => !r.active && !r.approved_at)
  const memberRows = rows.filter((r) => r.active || r.approved_at)
  const owners = rows.filter((r) => r.role === 'owner' && r.active).length
  const staff = rows.filter((r) => r.role === 'staff' && r.active).length

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 pb-[calc(7rem+var(--badge-h,0px))] pt-5">
      <header className="flex items-center gap-2">
        <Link to="/owner" aria-label={t('common.back')} className="-ml-3 flex h-11 w-11 items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold">{t('users.title')}</h1>
          <span className="text-[13px] text-muted">{t('users.counts', { owners, staff })}</span>
        </div>
      </header>

      {msg && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-okbg text-ok' : 'bg-badbg text-bad'}`}>{msg.text}</p>
      )}

      {pendingRows.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold">{t('users.pending')} ({pendingRows.length})</h2>
          {pendingRows.map((r) => {
            const f = approveForm[r.id] ?? { role: 'staff' as Role, wage: '' }
            const setF = (v: Partial<typeof f>) => setApproveForm({ ...approveForm, [r.id]: { ...f, ...v } })
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-[14px] border border-warnline bg-white p-3.5">
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold">{r.display_name}</span>
                  <span className="text-xs text-muted">{r.username}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1 text-xs text-muted">{t('users.role')}
                    <select className={input} value={f.role} onChange={(e) => setF({ role: e.target.value as Role })}>
                      <option value="staff">{t('home.staff')}</option><option value="owner">{t('home.owner')}</option>
                    </select></label>
                  <label className="flex flex-col gap-1 text-xs text-muted">{pay ? t('users.salary') : t('users.wage')}
                    <input className={input} inputMode="decimal" value={f.wage} onChange={(e) => setF({ wage: e.target.value })} /></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={btn} disabled={busy} onClick={() => reject(r)}>{t('users.reject')}</button>
                  <button type="button" className={btnP} disabled={busy} onClick={() => approve(r)}>{t('users.approve')}</button>
                </div>
              </div>
            )
          })}
        </section>
      )}

      <section className="flex flex-col gap-2">
        {memberRows.map((r) => (
          <div key={r.id} className={`flex flex-col gap-3 rounded-[18px] bg-white shadow-[0_1px_0_var(--color-line)] p-3.5 ${r.active ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold">{r.display_name}</span>
                <span className="text-xs text-muted">{r.username} · {r.role === 'owner' ? t('home.owner') : t('home.staff')}{r.active ? '' : ` · ${t('users.disabled')}`}</span>
                {r.role === 'staff' && pay?.[r.id] && (
                  <span className="text-xs font-semibold text-tealink">{t('users.pay_line', { salary: fmtMoney(pay[r.id].monthly_salary), ot: fmtMoney(pay[r.id].ot_rate) })}</span>
                )}
              </div>
              {editing !== r.id && <button type="button" className={btn} onClick={() => startEdit(r)}>{t('users.edit')}</button>}
            </div>

            {editing === r.id && (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-xs text-muted">{t('users.display_name')}
                  <input className={input} value={edit.display_name} onChange={(e) => setEdit({ ...edit, display_name: e.target.value })} /></label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1 text-xs text-muted">{t('users.role')}
                    <select className={input} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Role })}>
                      <option value="staff">{t('home.staff')}</option><option value="owner">{t('home.owner')}</option>
                    </select></label>
                  {!pay && <label className="flex flex-col gap-1 text-xs text-muted">{t('users.wage')}
                    <input className={input} inputMode="decimal" value={edit.wage_per_shift} onChange={(e) => setEdit({ ...edit, wage_per_shift: e.target.value })} /></label>}
                </div>
                {pay && edit.role === 'staff' && (
                  <div className="flex flex-col gap-2.5 rounded-2xl bg-tealbg p-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="flex flex-col gap-1 text-xs font-semibold text-tealink">{t('users.salary')}
                        <input className={input} inputMode="decimal" value={edit.salary} onChange={(e) => setEdit({ ...edit, salary: e.target.value })} /></label>
                      <label className="flex flex-col gap-1 text-xs font-semibold text-tealink">{t('users.ot_rate')}
                        <input className={input} inputMode="decimal" value={edit.ot_rate} onChange={(e) => setEdit({ ...edit, ot_rate: e.target.value })} /></label>
                    </div>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-tealink">{t('users.start_date')}
                      <input type="date" className={input} value={edit.start_date} onChange={(e) => setEdit({ ...edit, start_date: e.target.value })} /></label>
                    <span className="text-xs text-tealink">{t('users.start_hint')}</span>
                  </div>
                )}
                <label className="flex flex-col gap-1 text-xs text-muted">{t('users.new_password')}
                  <PasswordInput className={input} autoComplete="new-password" placeholder={t('users.password_hint')} value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" className={btn} onClick={() => setEditing(null)}>{t('common.cancel')}</button>
                  <button type="button" className={btn} disabled={busy || r.id === profile?.id} onClick={() => toggleActive(r)}>
                    {r.active ? t('users.disable') : t('users.enable')}</button>
                  <button type="button" className={btnP} disabled={busy} onClick={() => save(r)}>{t('common.save')}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <form onSubmit={create} className="flex flex-col gap-3 rounded-[18px] bg-white shadow-[0_1px_0_var(--color-line)] p-4">
        <h2 className="text-[15px] font-semibold">{t('users.add')}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1 text-xs text-muted">{t('login.username')}
            <input className={input} required autoCapitalize="none" autoCorrect="off" pattern="[a-z0-9._\-]{3,30}" title={t('users.username_hint')}
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} /></label>
          <label className="flex flex-col gap-1 text-xs text-muted">{t('users.display_name')}
            <input className={input} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></label>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted">{t('login.password')}
          <PasswordInput className={input} required minLength={8} autoComplete="new-password" placeholder={t('users.password_hint')}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1 text-xs text-muted">{t('users.role')}
            <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="staff">{t('home.staff')}</option><option value="owner">{t('home.owner')}</option>
            </select></label>
          {!pay && <label className="flex flex-col gap-1 text-xs text-muted">{t('users.wage')}
            <input className={input} inputMode="decimal" value={form.wage_per_shift} onChange={(e) => setForm({ ...form, wage_per_shift: e.target.value })} /></label>}
        </div>
        <span className="text-xs text-muted">{t('users.username_hint')}</span>
        {pay && <span className="text-xs text-muted">{t('users.pay_after_add')}</span>}
        <button type="submit" disabled={busy} className={btnP}>{t('users.add')}</button>
      </form>
    </main>
  )
}
