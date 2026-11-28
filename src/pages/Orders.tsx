import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sb, pickName, fmtNum, fmtDateTime } from '../lib/db'
import { useStockData, needList } from '../lib/stock'
import { pushOrders } from '../lib/gsync'
import { Button, Card, Empty, Loading, Msg, Page, Pill, Row } from '../components/ui'

interface Mark { id: string; supplier_product_id: string; packs: number | null; status: 'ordered' | 'received'; created_at: string }

export default function Orders() {
  const { t } = useTranslation()
  const { data } = useStockData()
  const [marks, setMarks] = useState<Mark[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const loadMarks = useCallback(async () => {
    const { data: m } = await sb.from('purchase_marks').select('*').eq('status', 'ordered').order('created_at', { ascending: false })
    setMarks((m as Mark[]) ?? [])
  }, [])
  useEffect(() => { loadMarks() }, [loadMarks])

  if (!data) return <Page title={t('orders.title')} back="/owner"><Loading /></Page>

  const ordered = new Set(marks.map((m) => m.supplier_product_id))
  const today = new Date().getDay()

  const markOrdered = async (spId: string, packs: number | null) => {
    setBusy(true)
    const { error } = await sb.from('purchase_marks').insert({ supplier_product_id: spId, packs })
    setMsg(error ? { ok: false, text: t('common.save_failed') } : { ok: true, text: t('orders.marked') })
    await loadMarks()
    pushOrders()
    setBusy(false)
  }

  return (
    <Page title={t('orders.title')} subtitle={t('orders.subtitle')} back="/owner">
      <Msg msg={msg} />
      {data.suppliers.map((s) => {
        const need = needList(data, s.id).filter((n) => !(n.product && ordered.has(n.product.id)))
        const dueToday = need.some((n) => n.product?.order_weekdays.includes(today))
        return (
          <Card key={s.id} tone={need.length ? 'warn' : undefined}>
            <Row>
              <span className="text-base font-bold">{s.name}</span>
              {s.kind === 'market' ? <Pill tone={need.length ? 'warn' : 'ok'}>{need.length ? t('orders.staff_alerted') : t('orders.nothing')}</Pill>
                : need.length ? <Pill tone="warn">{dueToday ? t('orders.due_today', { n: need.length }) : t('orders.to_order', { n: need.length })}</Pill>
                : <Pill tone="ok">{t('orders.nothing')}</Pill>}
            </Row>
            {need.map((n) => (
              <div key={n.item.id} className="flex items-center justify-between gap-3 border-t border-line pt-2.5 text-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold">{n.product?.product_name ?? pickName(n.item)}</span>
                  <span className="text-xs text-muted">
                    {t('orders.shop_name', { name: pickName(n.item) })} · {t('orders.left', { qty: fmtNum(data.stock[n.item.id]?.qty ?? 0), min: fmtNum(n.item.safety_stock), unit: n.item.count_unit })}
                  </span>
                  {n.product?.url && <a href={n.product.url} target="_blank" rel="noreferrer" className="text-xs underline">{t('orders.open_link')}</a>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold">{n.packs != null ? t('orders.packs', { n: n.packs }) : `${fmtNum(n.short)} ${n.item.count_unit}`}</span>
                  {s.kind !== 'market' && n.product && <Button small disabled={busy} onClick={() => markOrdered(n.product!.id, n.packs)}>{t('orders.mark')}</Button>}
                </div>
              </div>
            ))}
          </Card>
        )
      })}

      <Card>
        <span className="text-[15px] font-semibold">{t('orders.waiting')}</span>
        <span className="text-xs text-muted">{t('orders.waiting_hint')}</span>
        {marks.length === 0 && <Empty>{t('common.none')}</Empty>}
        {marks.map((m) => {
          const sp = data.products.find((p) => p.id === m.supplier_product_id)
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 border-t border-line pt-2.5 text-sm">
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{sp?.product_name ?? '–'}</span>
                <span className="text-xs text-muted">{t('orders.packs', { n: m.packs ?? 1 })} · {fmtDateTime(m.created_at)}</span>
              </div>
              <Pill tone="warn">{t('orders.wait_staff')}</Pill>
            </div>
          )
        })}
      </Card>
      <p className="text-xs text-muted">{t('orders.sheet_note')}</p>
    </Page>
  )
}
