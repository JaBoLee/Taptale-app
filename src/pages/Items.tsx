import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sb, pickName, fmtNum } from '../lib/db'
import { useStockData, isLow, qtyOf, type Item } from '../lib/stock'
import { autoTranslate } from '../lib/translate'
import { Button, Card, Empty, Field, Loading, Msg, Page, Pill, Row, Seg, inputCls } from '../components/ui'

export function ItemList() {
  const { t } = useTranslation()
  const { data, reload } = useStockData()
  const [cat, setCat] = useState<Item['category']>('food')
  const [showOff, setShowOff] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  if (!data) return <Page title={t('items.title')} back="/owner"><Loading /></Page>
  const inCat = data.items.filter((i) => i.category === cat)
  const off = inCat.filter((i) => !i.active)
  const list = inCat.filter((i) => showOff || i.active)
    .sort((a, b) => (a.location ?? '\uffff').localeCompare(b.location ?? '\uffff') || a.sort_order - b.sort_order || a.name_th.localeCompare(b.name_th))

  /** ลบวัตถุดิบ: เอาออกจากสูตรก่อน; ถ้ามีประวัติสต๊อกให้ซ่อน (active=false) เพื่อเก็บประวัติไว้ ถ้าไม่มีลบจริง */
  const remove = async (it: Item) => {
    setBusy(true)
    setMsg(null)
    const { error: e1 } = await sb.from('recipe_lines').delete().eq('item_id', it.id)
    const { count } = await sb.from('stock_events').select('id', { count: 'exact', head: true }).eq('item_id', it.id)
    const { error: e2 } = count && count > 0
      ? await sb.from('items').update({ active: false }).eq('id', it.id)
      : await sb.from('items').delete().eq('id', it.id)
    setBusy(false)
    setConfirm(null)
    if (e1 || e2) { setMsg({ ok: false, text: t('common.save_failed') }); return }
    setMsg({ ok: true, text: t('items.deleted', { name: pickName(it) }) })
    reload()
  }

  return (
    <Page title={t('items.title')} subtitle={t('items.count', { n: data.items.filter((i) => i.active).length })} back="/owner"
      right={<Link to="/items/new" className="flex min-h-11 items-center rounded-[14px] bg-amber px-3.5 text-sm font-semibold text-ink">+ {t('common.new')}</Link>}>
      <Seg label={t('stock.category')} value={cat} onChange={setCat}
        options={[{ value: 'food', label: t('cat.food') }, { value: 'can_beer', label: t('cat.can_beer') }, { value: 'supply', label: t('cat.supply') }]} />
      <Msg msg={msg} />
      {list.length === 0 && <Empty>{t('common.none')}</Empty>}
      {list.map((it) => {
        const usedIn = data.lines.filter((l) => l.item_id === it.id).length
        if (confirm === it.id) {
          return (
            <section key={it.id} className="flex flex-col gap-2.5 rounded-2xl bg-white p-3.5 ring-2 ring-danger">
              <Row><span className="text-[15px] font-semibold">{t('items.del_q', { name: pickName(it) })}</span>{usedIn > 0 && <Pill tone="bad">{t('items.used_in', { n: usedIn })}</Pill>}</Row>
              <span className="text-[13px] text-ink2">{t('items.del_body')}</span>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setConfirm(null)} disabled={busy}>{t('common.cancel')}</Button>
                <Button variant="solidDanger" onClick={() => remove(it)} disabled={busy}>{t('items.del_yes')}</Button>
              </div>
            </section>
          )
        }
        return (
          <div key={it.id} className={`flex items-center gap-1 rounded-2xl bg-white py-1.5 pl-3.5 pr-1 shadow-[0_1px_0_var(--color-line)] ${it.active ? '' : 'opacity-55'}`}>
            <Link to={`/items/${it.id}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
              <span className="text-[15px] font-semibold">{pickName(it)}</span>
              <span className="truncate text-xs text-muted">{data.suppliers.find((s) => s.id === it.default_supplier_id)?.name ?? '–'} · {t('items.min_short', { qty: fmtNum(it.safety_stock), unit: it.count_unit })}</span>
            </Link>
            {isLow(data, it) ? <Pill tone="bad">{fmtNum(qtyOf(data, it.id))}</Pill> : <Pill>{fmtNum(qtyOf(data, it.id))}</Pill>}
            {it.active && (
              <button type="button" aria-label={t('items.del_aria', { name: pickName(it) })} onClick={() => { setConfirm(it.id); setMsg(null) }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-danger">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
              </button>
            )}
          </div>
        )
      })}
      {off.length > 0 && <Button onClick={() => setShowOff(!showOff)}>{showOff ? t('items.hide_off') : t('items.show_off', { n: off.length })}</Button>}
    </Page>
  )
}

interface SP { id?: string; supplier_id: string; product_name: string; url: string; pack_qty: string; order_weekdays: number[] }
const DAYS = [1, 2, 3, 4, 5, 6, 0]

export function ItemEdit() {
  const { t } = useTranslation()
  const { id } = useParams()
  const nav = useNavigate()
  const isNew = id === 'new'
  const { data } = useStockData()
  const [f, setF] = useState({ name_th: '', name_en: '', name_my: '', category: 'food' as Item['category'], count_unit: '', safety_stock: '0', default_supplier_id: '', active: true, location: '' })
  const [sps, setSps] = useState<SP[]>([])
  const [tr, setTr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!data || isNew) return
    const it = data.items.find((x) => x.id === id)
    if (!it) return
    setF({ name_th: it.name_th, name_en: it.name_en ?? '', name_my: it.name_my ?? '', category: it.category, count_unit: it.count_unit,
      safety_stock: String(it.safety_stock), default_supplier_id: it.default_supplier_id ?? '', active: it.active, location: it.location ?? '' })
    setSps(data.products.filter((p) => p.item_id === id).map((p) => ({ id: p.id, supplier_id: p.supplier_id, product_name: p.product_name,
      url: p.url ?? '', pack_qty: String(p.pack_qty), order_weekdays: p.order_weekdays ?? [] })))
  }, [data, id, isNew])

  if (!data) return <Page title={t('items.edit')} back="/items"><Loading /></Page>
  const weekday = (d: number) => t(`days.d${d}`)
  const usedIn = isNew ? [] : data.lines.filter((l) => l.item_id === id).map((l) => ({ menu: data.menus.find((m) => m.id === l.menu_id), qty: l.qty }))

  const fillTr = async (force: boolean) => {
    if (!f.name_th.trim() || (!force && f.name_en.trim() && f.name_my.trim())) return f
    setTr(true)
    const r = await autoTranslate([f.name_th], 'ingredient')
    setTr(false)
    if (!r) { if (force) setMsg({ ok: false, text: t('tr.failed') }); return f }
    const nf = { ...f, name_en: force || !f.name_en.trim() ? r.en[0] : f.name_en, name_my: force || !f.name_my.trim() ? r.my[0] : f.name_my }
    setF(nf)
    return nf
  }

  const save = async () => {
    if (!f.name_th.trim() || !f.count_unit.trim()) { setMsg({ ok: false, text: t('items.need') }); return }
    setBusy(true)
    const g = await fillTr(false)
    const row = { name_th: g.name_th.trim(), name_en: g.name_en.trim() || null, name_my: g.name_my.trim() || null, category: f.category,
      count_unit: f.count_unit.trim(), safety_stock: Number(f.safety_stock) || 0, default_supplier_id: f.default_supplier_id || null, active: f.active, location: f.location.trim() || null }
    let itemId = id as string
    if (isNew) {
      const { data: ins, error } = await sb.from('items').insert(row).select('id').single()
      if (error || !ins) { setMsg({ ok: false, text: t('common.save_failed') }); setBusy(false); return }
      itemId = (ins as { id: string }).id
    } else {
      const { error } = await sb.from('items').update(row).eq('id', itemId)
      if (error) { setMsg({ ok: false, text: t('common.save_failed') }); setBusy(false); return }
    }
    const keep = sps.filter((s) => s.supplier_id && s.product_name.trim())
    const existing = data.products.filter((p) => p.item_id === itemId).map((p) => p.id)
    const removed = existing.filter((pid) => !keep.some((s) => s.id === pid))
    if (removed.length) await sb.from('supplier_products').delete().in('id', removed)
    for (const s of keep) {
      const r = { item_id: itemId, supplier_id: s.supplier_id, product_name: s.product_name.trim(), url: s.url.trim() || null,
        pack_qty: Number(s.pack_qty) || 1, order_weekdays: s.order_weekdays, preferred: s.supplier_id === row.default_supplier_id }
      const { error } = s.id ? await sb.from('supplier_products').update(r).eq('id', s.id) : await sb.from('supplier_products').insert(r)
      if (error) { setMsg({ ok: false, text: t('common.save_failed') }); setBusy(false); return }
    }
    setBusy(false)
    nav('/items')
  }

  const setSp = (i: number, v: Partial<SP>) => setSps(sps.map((s, j) => (j === i ? { ...s, ...v } : s)))

  return (
    <Page title={isNew ? t('items.new') : t('items.edit')} back="/items">
      <Card>
        <Field label={t('items.name_th')} hint={t('items.name_hint')}><input className={inputCls} value={f.name_th} onChange={(e) => setF({ ...f, name_th: e.target.value })} onBlur={() => fillTr(false)} /></Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="English"><input className={inputCls} value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></Field>
          <Field label="မြန်မာ"><input className={inputCls} value={f.name_my} onChange={(e) => setF({ ...f, name_my: e.target.value })} /></Field>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted">{tr ? t('tr.working') : t('tr.hint')}</span>
          <Button small disabled={tr || !f.name_th.trim()} onClick={() => fillTr(true)}>{t('tr.again')}</Button>
        </div>
        <Field label={t('items.location')} hint={t('items.location_hint')}>
          <input className={inputCls} list="item-locations" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <datalist id="item-locations">{[...new Set(data.items.map((x) => x.location).filter(Boolean))].map((l) => <option key={l} value={l!} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t('stock.category')}>
            <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Item['category'] })}>
              <option value="food">{t('cat.food')}</option><option value="can_beer">{t('cat.can_beer')}</option><option value="supply">{t('cat.supply')}</option>
            </select>
          </Field>
          <Field label={t('items.unit')} hint={t('items.unit_hint')}><input className={inputCls} value={f.count_unit} onChange={(e) => setF({ ...f, count_unit: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t('items.safety')}><input className={inputCls} inputMode="decimal" value={f.safety_stock} onChange={(e) => setF({ ...f, safety_stock: e.target.value })} /></Field>
          <Field label={t('items.buy_from')}>
            <select className={inputCls} value={f.default_supplier_id} onChange={(e) => setF({ ...f, default_supplier_id: e.target.value })}>
              <option value="">{t('common.choose')}</option>
              {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-amberink" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          {t('items.active')}
        </label>
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('items.supplier_names')}</span>
        <span className="text-xs text-muted">{t('items.supplier_hint')}</span>
        {sps.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="grid grid-cols-[1fr_44px] items-end gap-2">
              <Field label={t('items.supplier')}>
                <select className={inputCls} value={s.supplier_id} onChange={(e) => setSp(i, { supplier_id: e.target.value })}>
                  <option value="">{t('common.choose')}</option>
                  {data.suppliers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </Field>
              <button type="button" aria-label={t('common.delete')} className="flex h-11 items-center justify-center text-bad" onClick={() => setSps(sps.filter((_, j) => j !== i))}>✕</button>
            </div>
            <Field label={t('items.product_name')}><input className={inputCls} value={s.product_name} onChange={(e) => setSp(i, { product_name: e.target.value })} /></Field>
            <Field label={t('items.link')}><input className={inputCls} type="url" value={s.url} onChange={(e) => setSp(i, { url: e.target.value })} /></Field>
            <Field label={t('items.pack', { unit: f.count_unit || '…' })}><input className={inputCls} inputMode="decimal" value={s.pack_qty} onChange={(e) => setSp(i, { pack_qty: e.target.value })} /></Field>
            <div className="flex flex-col gap-1 text-xs text-muted">
              {t('items.order_days')}
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => {
                  const on = s.order_weekdays.includes(d)
                  return (
                    <button key={d} type="button" aria-pressed={on} onClick={() => setSp(i, { order_weekdays: on ? s.order_weekdays.filter((x) => x !== d) : [...s.order_weekdays, d] })}
                      className={`h-10 min-w-11 rounded-lg border px-2 text-[13px] ${on ? 'border-ink bg-ink text-white' : 'border-edge bg-white text-ink'}`}>
                      {weekday(d)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
        <Button small onClick={() => setSps([...sps, { supplier_id: f.default_supplier_id, product_name: '', url: '', pack_qty: '1', order_weekdays: [] }])}>{t('items.add_supplier')}</Button>
      </Card>

      {usedIn.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('items.used_in')}</span>
          {usedIn.map((u, i) => <Row key={i}><span>{pickName(u.menu)}</span><span className="text-muted">{fmtNum(u.qty, 3)} {f.count_unit}</span></Row>)}
        </Card>
      )}

      <Msg msg={msg} />
      <Button variant="primary" disabled={busy} onClick={save}>{t('common.save')}</Button>
    </Page>
  )
}
