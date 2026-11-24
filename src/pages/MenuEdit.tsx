import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sb, pickName } from '../lib/db'
import { useStockData } from '../lib/stock'
import { autoTranslate } from '../lib/translate'
import { Button, Card, Field, Loading, Msg, Page, Seg, inputCls } from '../components/ui'

interface Line { item_id: string; qty: string }

export default function MenuEdit() {
  const { t } = useTranslation()
  const { id } = useParams()
  const nav = useNavigate()
  const isNew = id === 'new'
  const { data } = useStockData()
  const [f, setF] = useState({ name_th: '', name_en: '', name_my: '', steps_th: '', steps_en: '', steps_my: '', min_portions: '1', active: true,
    code: '', kind: 'dish' as 'dish' | 'prep', ingredients_th: '', ingredients_en: '', ingredients_my: '' })
  const [lines, setLines] = useState<Line[]>([])
  const [tr, setTr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!data || isNew) return
    const m = data.menus.find((x) => x.id === id)
    if (!m) return
    setF({ name_th: m.name_th, name_en: m.name_en ?? '', name_my: m.name_my ?? '', steps_th: m.steps_th ?? '', steps_en: m.steps_en ?? '',
      steps_my: m.steps_my ?? '', min_portions: String(m.min_portions), active: m.active,
      code: m.code ?? '', kind: m.kind ?? 'dish', ingredients_th: m.ingredients_th ?? '', ingredients_en: m.ingredients_en ?? '', ingredients_my: m.ingredients_my ?? '' })
    setLines(data.lines.filter((l) => l.menu_id === id).map((l) => ({ item_id: l.item_id, qty: String(l.qty) })))
  }, [data, id, isNew])

  if (!data) return <Page title={t('menuedit.title')} back="/recipes"><Loading /></Page>

  const fillTr = async (force: boolean) => {
    const needName = !!f.name_th.trim() && (force || !f.name_en.trim() || !f.name_my.trim())
    const needSteps = !!f.steps_th.trim() && (force || !f.steps_en.trim() || !f.steps_my.trim())
    const needIng = !!f.ingredients_th.trim() && (force || !f.ingredients_en.trim() || !f.ingredients_my.trim())
    if (!needName && !needSteps && !needIng) return f
    setTr(true)
    const [n, st, ig] = await Promise.all([
      needName ? autoTranslate([f.name_th], 'menu') : Promise.resolve(null),
      needSteps ? autoTranslate([f.steps_th], 'steps') : Promise.resolve(null),
      needIng ? autoTranslate([f.ingredients_th], 'steps') : Promise.resolve(null),
    ])
    setTr(false)
    if (force && !n && !st && !ig) setMsg({ ok: false, text: t('tr.failed') })
    const pick = (cur: string, v: string | undefined) => (v && (force || !cur.trim()) ? v : cur)
    const nf = { ...f,
      name_en: pick(f.name_en, n?.en[0]), name_my: pick(f.name_my, n?.my[0]),
      steps_en: pick(f.steps_en, st?.en[0]), steps_my: pick(f.steps_my, st?.my[0]),
      ingredients_en: pick(f.ingredients_en, ig?.en[0]), ingredients_my: pick(f.ingredients_my, ig?.my[0]) }
    setF(nf)
    return nf
  }

  const save = async () => {
    if (!f.name_th.trim()) { setMsg({ ok: false, text: t('menuedit.need_name') }); return }
    setBusy(true)
    const g = await fillTr(false)
    const row = { name_th: g.name_th.trim(), name_en: g.name_en.trim() || null, name_my: g.name_my.trim() || null,
      steps_th: g.steps_th || null, steps_en: g.steps_en || null, steps_my: g.steps_my || null,
      min_portions: Math.max(1, Number(f.min_portions) || 1), active: f.active,
      code: f.code.trim().toUpperCase() || null, kind: f.kind,
      ingredients_th: g.ingredients_th || null, ingredients_en: g.ingredients_en || null, ingredients_my: g.ingredients_my || null }
    let menuId = id as string
    if (isNew) {
      const { data: ins, error } = await sb.from('menus').insert(row).select('id').single()
      if (error || !ins) { setMsg({ ok: false, text: t('common.save_failed') }); setBusy(false); return }
      menuId = (ins as { id: string }).id
    } else {
      const { error } = await sb.from('menus').update(row).eq('id', menuId)
      if (error) { setMsg({ ok: false, text: t('common.save_failed') }); setBusy(false); return }
    }
    await sb.from('recipe_lines').delete().eq('menu_id', menuId)
    const valid = lines.filter((l) => l.item_id && Number(l.qty) > 0)
    const merged = Object.values(valid.reduce<Record<string, { menu_id: string; item_id: string; qty: number }>>((acc, l) => {
      acc[l.item_id] = { menu_id: menuId, item_id: l.item_id, qty: (acc[l.item_id]?.qty ?? 0) + Number(l.qty) }
      return acc
    }, {}))
    if (merged.length) {
      const { error } = await sb.from('recipe_lines').insert(merged)
      if (error) { setMsg({ ok: false, text: t('common.save_failed') }); setBusy(false); return }
    }
    setBusy(false)
    nav('/recipes')
  }

  const remove = async () => {
    if (isNew) return
    setBusy(true)
    const { error } = await sb.from('menus').update({ active: false }).eq('id', id)
    setBusy(false)
    if (!error) nav('/recipes')
  }

  return (
    <Page title={isNew ? t('menuedit.new') : t('menuedit.title')} back="/recipes">
      <Card>
        <Seg label={t('menuedit.kind')} value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={[{ value: 'dish', label: t('menuedit.kind_dish') }, { value: 'prep', label: t('menuedit.kind_prep') }]} />
        <Field label={t('menuedit.code')} hint={t('menuedit.code_hint')}><input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
        <Field label={t('items.name_th')}><input className={inputCls} value={f.name_th} onChange={(e) => setF({ ...f, name_th: e.target.value })} onBlur={() => fillTr(false)} /></Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="English"><input className={inputCls} value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></Field>
          <Field label="မြန်မာ"><input className={inputCls} value={f.name_my} onChange={(e) => setF({ ...f, name_my: e.target.value })} /></Field>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted">{tr ? t('tr.working') : t('tr.hint')}</span>
          <Button small disabled={tr || (!f.name_th.trim() && !f.steps_th.trim() && !f.ingredients_th.trim())} onClick={() => fillTr(true)}>{t('tr.again')}</Button>
        </div>
        <Field label={t('menuedit.min')} hint={t('menuedit.min_hint')}>
          <input className={inputCls} inputMode="numeric" value={f.min_portions} onChange={(e) => setF({ ...f, min_portions: e.target.value })} />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-amberink" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          {t('menuedit.active')}
        </label>
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('menuedit.ing_text')}</span>
        <span className="text-xs text-muted">{t('menuedit.ing_text_hint')}</span>
        <Field label="ไทย"><textarea className={`${inputCls} h-28 py-2`} value={f.ingredients_th} onChange={(e) => setF({ ...f, ingredients_th: e.target.value })} onBlur={() => fillTr(false)} /></Field>
        <Field label="English"><textarea className={`${inputCls} h-20 py-2`} value={f.ingredients_en} onChange={(e) => setF({ ...f, ingredients_en: e.target.value })} /></Field>
        <Field label="မြန်မာ"><textarea className={`${inputCls} h-20 py-2`} value={f.ingredients_my} onChange={(e) => setF({ ...f, ingredients_my: e.target.value })} /></Field>
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('menuedit.stock_lines')}</span>
        <span className="text-xs text-muted">{t('menuedit.ing_hint')}</span>
        {lines.map((l, i) => {
          const it = data.items.find((x) => x.id === l.item_id)
          return (
            <div key={i} className="grid grid-cols-[1fr_88px_44px] items-end gap-2">
              <Field label={t('waste.item')}>
                <select className={inputCls} value={l.item_id} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, item_id: e.target.value } : x)))}>
                  <option value="">{t('common.choose')}</option>
                  {data.items.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{pickName(x)} ({x.count_unit})</option>)}
                </select>
              </Field>
              <Field label={it ? it.count_unit : t('waste.qty')}>
                <input className={inputCls} inputMode="decimal" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
              </Field>
              <button type="button" aria-label={t('common.delete')} className="flex h-11 items-center justify-center text-bad" onClick={() => setLines(lines.filter((_, j) => j !== i))}>✕</button>
            </div>
          )
        })}
        <Button small onClick={() => setLines([...lines, { item_id: '', qty: '' }])}>{t('menuedit.add_ing')}</Button>
      </Card>

      <Card>
        <span className="text-[15px] font-semibold">{t('menuedit.steps')}</span>
        <Field label="ไทย"><textarea className={`${inputCls} h-28 py-2`} value={f.steps_th} onChange={(e) => setF({ ...f, steps_th: e.target.value })} onBlur={() => fillTr(false)} /></Field>
        <Field label="English"><textarea className={`${inputCls} h-20 py-2`} value={f.steps_en} onChange={(e) => setF({ ...f, steps_en: e.target.value })} /></Field>
        <Field label="မြန်မာ"><textarea className={`${inputCls} h-20 py-2`} value={f.steps_my} onChange={(e) => setF({ ...f, steps_my: e.target.value })} /></Field>
      </Card>

      <Msg msg={msg} />
      <Button variant="primary" disabled={busy} onClick={save}>{t('common.save')}</Button>
      {!isNew && <Button variant="danger" disabled={busy} onClick={remove}>{t('menuedit.hide')}</Button>}
    </Page>
  )
}
