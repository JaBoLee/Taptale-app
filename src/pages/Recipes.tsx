import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { pickName, pickSteps, pickIngredients, fmtNum } from '../lib/db'
import { useStockData, portions, menuAvailable, qtyOf } from '../lib/stock'
import { Card, Empty, LinkButton, Loading, Page, Pill, Row, Seg, inputCls } from '../components/ui'

export default function Recipes() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { data } = useStockData()
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<'dish' | 'prep'>('dish')
  const owner = profile?.role === 'owner'

  if (!data) return <Page title={t('recipes.title')}><Loading /></Page>
  const s = q.trim().toLowerCase()
  const menus = data.menus.filter((m) => m.active || owner)
    .filter((m) => (m.kind ?? 'dish') === kind)
    .filter((m) => !s || [m.name_th, m.name_en, m.name_my, m.code].some((n) => n?.toLowerCase().includes(s)))
    .sort((a, b) => Number(menuAvailable(data, a)) - Number(menuAvailable(data, b)) || (a.code ?? '~').localeCompare(b.code ?? '~'))

  return (
    <Page title={t('recipes.title')} right={owner ? <Link to="/menus/new" className="flex h-11 items-center px-2 text-sm font-semibold">{t('common.new')}</Link> : undefined}>
      <Seg label={t('recipes.title')} value={kind} onChange={setKind} options={[{ value: 'dish', label: t('recipes.tab_dish') }, { value: 'prep', label: t('recipes.tab_prep') }]} />
      <input className={inputCls} type="search" placeholder={t('common.search')} aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      {menus.length === 0 && <Empty>{t('recipes.empty')}</Empty>}
      {menus.map((m) => {
        const p = portions(data, m.id)
        const ok = menuAvailable(data, m)
        const lines = data.lines.filter((l) => l.menu_id === m.id)
        const isOpen = open === m.id
        const prep = m.kind === 'prep'
        const ing = pickIngredients(m)
        return (
          <Card key={m.id} tone={ok ? undefined : 'bad'}>
            <button type="button" className="flex min-h-11 items-center justify-between gap-3 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.id)}>
              <span className="text-[15px] font-semibold">{m.code && <span className="mr-1.5 rounded-md bg-amberbg px-1.5 py-0.5 text-xs font-bold text-amberink">{m.code}</span>}{pickName(m)}{!m.active && ` (${t('recipes.hidden')})`}</span>
              {p == null ? <Pill>{t('recipes.no_recipe')}</Pill> : ok ? <Pill tone="ok">{t(prep ? 'recipes.can_make_batch' : 'recipes.can_make', { n: p })}</Pill> : <Pill tone="bad">{t('recipes.unavailable')}</Pill>}
            </button>
            {isOpen && (
              <>
                {ing && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{t('recipes.ingredients')}</span>
                    <p className="whitespace-pre-line text-sm leading-relaxed">{ing}</p>
                  </div>
                )}
                {lines.length > 0 && <span className="border-t border-line pt-2.5 text-xs text-muted">{t('recipes.stock_use')} · {prep ? t('recipes.per_batch') : t('recipes.per_dish')} · {t('recipes.min', { n: m.min_portions })}</span>}
                {lines.map((l) => {
                  const it = data.items.find((i) => i.id === l.item_id)
                  const enough = qtyOf(data, l.item_id) >= l.qty * m.min_portions
                  return (
                    <Row key={l.item_id}>
                      <span>{pickName(it)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted">{fmtNum(l.qty, 3)} {it?.count_unit}</span>
                        <Pill tone={enough ? 'ok' : 'bad'}>{t('recipes.left', { qty: fmtNum(qtyOf(data, l.item_id)) })}</Pill>
                      </span>
                    </Row>
                  )
                })}
                {pickSteps(m) && (
                  <div className="flex flex-col gap-1 border-t border-line pt-2.5">
                    <span className="text-sm font-semibold">{t('recipes.steps')}</span>
                    <p className="whitespace-pre-line text-sm leading-relaxed">{pickSteps(m)}</p>
                  </div>
                )}
                {owner && <LinkButton to={`/menus/${m.id}`}>{t('common.edit')}</LinkButton>}
              </>
            )}
          </Card>
        )
      })}
    </Page>
  )
}
