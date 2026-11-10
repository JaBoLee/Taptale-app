import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sb, pickName, fmtNum, fmtDateTime } from '../lib/db'
import { useStockData, isLow, qtyOf, type Item } from '../lib/stock'
import { pushOrders } from '../lib/gsync'
import { Button, Card, Empty, LinkButton, Loading, Msg, Page, Pill, Seg, inputCls, numCls } from '../components/ui'

type Cat = Item['category']
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
      .sort((a, b) => Number(isLow(data, b)) - Number(isLow(data, a)) || a.name_th.localeCompare(b.name_th))
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
      <Seg label={t('stock.category')} value={cat} onChange={setCat}
        options={[{ value: 'food', label: t('cat.food') }, { value: 'can_beer', label: t('cat.can_beer') }, { value: 'supply', label: t('cat.supply') }]} />
      <input className={inputCls} type="search" placeholder={t('common.search')} aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <Msg msg={msg} />
      {list.length === 0 && <Empty>{t('stock.empty')}</Empty>}
      {list.map((it) => {
        const low = isLow(data, it)
        const sp = data.products.find((p) => p.item_id === it.id && p.supplier_id === it.default_supplier_id)
        return (
          <Card key={it.id} tone={low ? 'bad' : undefined} className="!flex-row items-center !gap-3 !p-3.5">
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
        )
      })}
      <div className="sticky bottom-16 z-10 grid grid-cols-2 gap-2 bg-paper py-2">
        <LinkButton to="/stock/waste">{t('home.q_waste')}</LinkButton>
        <Button variant="primary" disabled={busy || filled.length === 0} onClick={save}>
          {mode === 'count' ? t('stock.save_count', { count: filled.length }) : t('stock.save_receive', { count: filled.length })}
        </Button>
      </div>
    </Page>
  )
}
