import { Fragment, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sb, pickName, fmtNum, fmtDateTime } from '../lib/db'
import { useStockData, isLow, qtyOf, type Item } from '../lib/stock'
import { pushOrders } from '../lib/gsync'
import { Button, Card, Empty, LinkButton, Loading, Msg, Page, Pill, Seg, inputCls, numCls } from '../components/ui'

type Cat = Item['category']

/** จุดสีแยกที่เก็บ: ครัว = เขียวฮอป, ห้องเก็บของ = อำพัน, บาร์น้ำ/อื่น ๆ = เข้ม */
const locDot = (loc: string | null) =>
  !loc ? 'bg-edge' : loc.startsWith('ในครัว') ? 'bg-teal' : loc.startsWith('ห้องเก็บ') ? 'bg-amber' : 'bg-ink'
type Mode = 'count' | 'receive'

export default function Stock() {
  const { t } = useTranslation()
  const loc = useLocation()
  const { data, reload } = useStockData()
  const [mode, setMode] = useState<Mode>(new URLSearchParams(loc.search).get('tab') === 'receive' ? 'receive' : 'count')
  const [cat, setCat] = useState<Cat>('food')
  const [q, setQ] = useState('')
  const [vals, setVals] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const list = useMemo(() => {
    if (!data) return []
    const s = q.trim().toLowerCase()
    return data.items
      .filter((it) => it.active && it.category === cat)
      .filter((it) => !s || [it.name_th, it.name_en, it.name_my].some((n) => n?.toLowerCase().includes(s)))
      // เรียงตามจุดเก็บและลำดับเดินนับ (เหมือนชีตเดิม); ไม่มีจุดเก็บไว้ท้ายสุด
      .sort((a, b) => (a.location ?? '\uffff').localeCompare(b.location ?? '\uffff') || a.sort_order - b.sort_order || a.name_th.localeCompare(b.name_th))
  }, [data, cat, q])

  if (!data) return <Page title={t('stock.title')}><Loading /></Page>

  const filled = Object.entries(vals).filter(([, v]) => v.trim() !== '' && !Number.isNaN(Number(v)))
  const supplierName = (id: string | null) => data.suppliers.find((s) => s.id === id)?.name ?? ''

  const save = async () => {
    setBusy(true)
    const rows = filled.map(([item_id, v]) => ({ item_id, kind: mode, qty: Number(v) }))
    const { error } = await sb.from('stock_events').insert(rows)
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('stock.saved', { count: rows.length }) })
    if (!error) { setVals({}); reload(); pushOrders() }
    setBusy(false)
  }

  return (
    <Page title={t('stock.title')} subtitle={mode === 'count' ? t('stock.count_hint') : t('stock.receive_hint')}>
      <Seg label={t('stock.mode')} value={mode} onChange={(v) => { setMode(v); setVals({}) }}
        options={[{ value: 'count', label: t('stock.count') }, { value: 'receive', label: t('stock.receive') }]} />
      {mode === 'receive' && <span className="text-xs font-semibold text-tealink">{t('stock.receive_hint')}</span>}
      <Seg label={t('stock.category')} value={cat} onChange={setCat}
        options={[{ value: 'food', label: t('cat.food') }, { value: 'can_beer', label: t('cat.can_beer') }, { value: 'supply', label: t('cat.supply') }]} />
      <input className={inputCls} type="search" placeholder={t('common.search')} aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="font-semibold">{t('stock.progress', { done: filled.filter(([id]) => list.some((x) => x.id === id)).length, total: list.length })}</span>
            <span className="text-muted">{t('stock.low_count', { count: list.filter((x) => isLow(data, x)).length })}</span>
          </div>
          <div className="h-2 rounded-full bg-sand"><div className="h-2 rounded-full bg-teal" style={{ width: `${Math.round((filled.filter(([id]) => list.some((x) => x.id === id)).length / list.length) * 100)}%` }} /></div>
        </div>
      )}
      <Msg msg={msg} />
      {list.length === 0 && <Empty>{t('stock.empty')}</Empty>}
      {list.map((it, i) => {
        const low = isLow(data, it)
        const head = (it.location ?? '') !== (list[i - 1]?.location ?? '') || i === 0
        const sp = data.products.find((p) => p.item_id === it.id && p.supplier_id === it.default_supplier_id)
        return (
          <Fragment key={it.id}>
          {head && (
            <h2 className="mt-2 flex items-center gap-2 text-[13px] font-bold">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${locDot(it.location)}`} />
              {it.location ? it.location.replace(/_/g, ' · ') : t('stock.no_location')}
            </h2>
          )}
          <Card tone={low ? 'bad' : undefined} className="!flex-row items-center !gap-3 !p-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{pickName(it)}</span>
              {sp && <span className="truncate text-xs text-muted">{supplierName(sp.supplier_id)}: {sp.product_name}</span>}
              <span className="text-xs text-muted">{t('stock.now', { qty: fmtNum(qtyOf(data, it.id)), unit: it.count_unit })} · {fmtDateTime(data.stock[it.id]?.last_counted_at)}</span>
              {low && <Pill tone="bad">{t('stock.below', { qty: fmtNum(it.safety_stock), unit: it.count_unit })}</Pill>}
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input className={numCls} inputMode="decimal" aria-label={pickName(it)} placeholder="–"
                value={vals[it.id] ?? ''} onChange={(e) => setVals({ ...vals, [it.id]: e.target.value })} />
              {it.count_unit}
            </label>
          </Card>
          </Fragment>
        )
      })}
      <div className="sticky bottom-[calc(5rem+var(--badge-h,0px))] z-10 grid grid-cols-2 gap-2 bg-paper py-2">
        <LinkButton to="/stock/waste">{t('home.q_waste')}</LinkButton>
        <Button variant="primary" disabled={busy || filled.length === 0} onClick={save}>
          {mode === 'count' ? t('stock.save_count', { count: filled.length }) : t('stock.save_receive', { count: filled.length })}
        </Button>
      </div>
    </Page>
  )
}
