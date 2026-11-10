import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, pickName, uploadPhoto, fmtTime, fmtNum, ymd } from '../lib/db'
import { useStockData } from '../lib/stock'
import { pushOrders } from '../lib/gsync'
import { Button, Card, Field, Loading, Msg, Page, Row, Seg, inputCls } from '../components/ui'

const REASONS = ['expired', 'spoiled', 'dropped', 'wrong_order', 'other'] as const

interface Ev { id: string; item_id: string; kind: string; qty: number; reason: string | null; created_at: string }

export default function Waste() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { data, reload } = useStockData()
  const [kind, setKind] = useState<'waste' | 'loss'>('waste')
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState<string>('expired')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [recent, setRecent] = useState<Ev[]>([])

  const loadRecent = async () => {
    const { data: ev } = await sb.from('stock_events').select('id, item_id, kind, qty, reason, created_at')
      .in('kind', ['waste', 'loss']).gte('created_at', ymd() + 'T00:00:00+07:00').order('created_at', { ascending: false })
    setRecent((ev as Ev[]) ?? [])
  }
  useEffect(() => { loadRecent() }, [])

  if (!data) return <Page title={t('waste.title')} back="/stock"><Loading /></Page>
  const item = data.items.find((i) => i.id === itemId)

  const save = async () => {
    if (!item || !qty || Number(qty) <= 0) { setMsg({ ok: false, text: t('waste.need_item') }); return }
    setBusy(true)
    try {
      const photo = file ? await uploadPhoto(file, 'waste') : null
      const { error } = await sb.from('stock_events').insert({
        item_id: item.id, kind, qty: Number(qty), reason: kind === 'waste' ? reason : 'loss', note: note || null, photo_url: photo, created_by: profile?.id,
      })
      if (error) throw error
      setMsg({ ok: true, text: t('waste.saved') })
      setQty(''); setNote(''); setFile(null); reload(); loadRecent(); pushOrders()
    } catch {
      setMsg({ ok: false, text: t('common.save_failed') })
    }
    setBusy(false)
  }

  return (
    <Page title={t('waste.title')} back="/stock">
      <Seg label={t('waste.kind')} value={kind} onChange={setKind}
        options={[{ value: 'waste', label: t('waste.waste') }, { value: 'loss', label: t('waste.loss') }]} />
      <Card>
        <Field label={t('waste.item')}>
          <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">{t('common.choose')}</option>
            {data.items.filter((i) => i.active).map((i) => <option key={i.id} value={i.id}>{pickName(i)}</option>)}
          </select>
        </Field>
        <Field label={`${t('waste.qty')}${item ? ` (${item.count_unit})` : ''}`}>
          <input className={inputCls} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        {kind === 'waste' && (
          <div className="flex flex-col gap-1 text-xs text-muted">
            {t('waste.reason')}
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)}
                  className={`h-10 rounded-full border px-4 text-[13px] ${reason === r ? 'border-ink bg-ink text-white' : 'border-[#D9D6D0] bg-white text-ink'}`}>
                  {t(`waste.r_${r}`)}
                </button>
              ))}
            </div>
          </div>
        )}
        <Field label={t('waste.note')}>
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Field label={t('waste.photo')}>
          <input type="file" accept="image/*" capture="environment" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
      </Card>
      <Msg msg={msg} />
      <Button variant="primary" disabled={busy} onClick={save}>{t('common.save')}</Button>
      <span className="text-xs text-muted">{t('waste.note_stock')}</span>
      {recent.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('waste.today')}</span>
          {recent.map((r) => {
            const it = data.items.find((i) => i.id === r.item_id)
            return (
              <Row key={r.id}>
                <span>{pickName(it)} {fmtNum(Number(r.qty))} {it?.count_unit} · {r.kind === 'loss' ? t('waste.loss') : t(`waste.r_${r.reason ?? 'other'}`)}</span>
                <span className="text-muted">{fmtTime(r.created_at)}</span>
              </Row>
            )
          })}
        </Card>
      )}
    </Page>
  )
}
