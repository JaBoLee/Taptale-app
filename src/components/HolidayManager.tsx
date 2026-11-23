import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sb, fmtDate, ymd } from '../lib/db'
import { Button, Card, Field, Msg, Pill, Row, inputCls } from './ui'
import type { Holiday } from '../lib/leave'

/** เจ้าของกำหนดวันหยุดนักขัตฤกษ์ของร้านแต่ละปี — พนักงานใช้ชดเชยได้หลังผ่านวันนั้น */
export default function HolidayManager() {
  const { t } = useTranslation()
  const [year, setYear] = useState(Number(ymd().slice(0, 4)))
  const [list, setList] = useState<Holiday[] | null>(null)
  const [ready, setReady] = useState(true)
  const [f, setF] = useState({ date: '', name: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await sb.from('public_holidays').select('id, holiday_date, name')
      .gte('holiday_date', `${year}-01-01`).lte('holiday_date', `${year}-12-31`).order('holiday_date')
    if (error) { setReady(false); return }
    setList((data as Holiday[]) ?? [])
  }, [year])
  useEffect(() => { load() }, [load])

  if (!ready) return null // ยังไม่ได้รัน migration 0009

  const add = async () => {
    if (!f.date || !f.name.trim()) { setMsg({ ok: false, text: t('hol.need') }); return }
    setBusy(true)
    const { error } = await sb.from('public_holidays').insert({ holiday_date: f.date, name: f.name.trim() })
    setBusy(false)
    if (error) { setMsg({ ok: false, text: error.code === '23505' ? t('hol.dup') : t('common.save_failed') }); return }
    setF({ date: '', name: '' }); setMsg(null); load()
  }
  const remove = async (h: Holiday) => {
    const { error } = await sb.from('public_holidays').delete().eq('id', h.id)
    setMsg(error ? { ok: false, text: t('hol.in_use') } : null)
    load()
  }

  return (
    <Card>
      <Row>
        <span className="text-[15px] font-bold">{t('hol.title')}</span>
        <span className="flex items-center gap-1">
          <Button small aria-label={t('hol.prev_year')} onClick={() => setYear(year - 1)}>‹</Button>
          <b className="w-12 text-center">{year}</b>
          <Button small aria-label={t('hol.next_year')} onClick={() => setYear(year + 1)}>›</Button>
        </span>
      </Row>
      <span className="text-xs text-muted">{t('hol.hint')}</span>
      {list?.length === 0 && <span className="text-sm text-muted">{t('hol.none')}</span>}
      {list?.map((h) => (
        <div key={h.id} className="flex min-h-11 items-center justify-between gap-2 border-t border-line pt-1.5 text-sm">
          <span className="flex min-w-0 flex-col"><span className="font-semibold">{h.name}</span><span className="text-xs text-muted">{fmtDate(h.holiday_date)}</span></span>
          <span className="flex items-center gap-1">
            {h.holiday_date < ymd() && <Pill tone="ok">{t('hol.passed')}</Pill>}
            <button type="button" aria-label={t('hol.remove', { name: h.name })} onClick={() => remove(h)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_1.4fr] gap-2 border-t border-line pt-2.5">
        <Field label={t('common.date')}><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label={t('hol.name')}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      </div>
      <Msg msg={msg} />
      <Button disabled={busy} onClick={add} className="!border-teal !text-tealink">+ {t('hol.add')}</Button>
    </Card>
  )
}
