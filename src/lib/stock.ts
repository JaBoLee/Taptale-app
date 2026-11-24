import { useCallback, useEffect, useState } from 'react'
import { sb } from './db'

export interface Supplier { id: string; name: string; kind: 'web' | 'market' | 'other' }
export interface Item {
  id: string; name_th: string; name_en: string | null; name_my: string | null
  category: 'food' | 'can_beer' | 'supply'; count_unit: string; safety_stock: number
  default_supplier_id: string | null; active: boolean
  location: string | null; sort_order: number
}
export interface SupplierProduct {
  id: string; item_id: string; supplier_id: string; product_name: string; url: string | null
  pack_qty: number; order_weekdays: number[]; preferred: boolean
}
export interface StockRow { item_id: string; qty: number; last_counted_at: string | null }
export interface Menu {
  id: string; name_th: string; name_en: string | null; name_my: string | null
  steps_th: string | null; steps_en: string | null; steps_my: string | null; min_portions: number; active: boolean
  code?: string | null; kind?: 'dish' | 'prep'
  ingredients_th?: string | null; ingredients_en?: string | null; ingredients_my?: string | null
}
export interface RecipeLine { menu_id: string; item_id: string; qty: number }

export interface StockData {
  items: Item[]; suppliers: Supplier[]; products: SupplierProduct[]; stock: Record<string, StockRow>
  menus: Menu[]; lines: RecipeLine[]
}

export function useStockData() {
  const [data, setData] = useState<StockData | null>(null)
  const load = useCallback(async () => {
    const [items, suppliers, products, stock, menus, lines] = await Promise.all([
      sb.from('items').select('*').order('name_th'),
      sb.from('suppliers').select('*').order('name'),
      sb.from('supplier_products').select('*'),
      sb.from('current_stock').select('*'),
      sb.from('menus').select('*').order('name_th'),
      sb.from('recipe_lines').select('*'),
    ])
    const stockMap: Record<string, StockRow> = {}
    for (const r of (stock.data ?? []) as StockRow[]) stockMap[r.item_id] = { ...r, qty: Number(r.qty) }
    setData({
      items: ((items.data ?? []) as Item[]).map((i) => ({ ...i, safety_stock: Number(i.safety_stock) })),
      suppliers: (suppliers.data ?? []) as Supplier[],
      products: ((products.data ?? []) as SupplierProduct[]).map((p) => ({ ...p, pack_qty: Number(p.pack_qty) })),
      stock: stockMap,
      menus: (menus.data ?? []) as Menu[],
      lines: ((lines.data ?? []) as RecipeLine[]).map((l) => ({ ...l, qty: Number(l.qty) })),
    })
  }, [])
  useEffect(() => { load() }, [load])
  return { data, reload: load }
}

export const qtyOf = (d: StockData, itemId: string) => d.stock[itemId]?.qty ?? 0
export const isLow = (d: StockData, it: Item) => it.safety_stock > 0 && qtyOf(d, it.id) < it.safety_stock

/** จานที่ทำได้ของแต่ละเมนู (null = ยังไม่มีสูตร) */
export function portions(d: StockData, menuId: string): number | null {
  const ls = d.lines.filter((l) => l.menu_id === menuId)
  if (!ls.length) return null
  return Math.max(0, Math.floor(Math.min(...ls.map((l) => qtyOf(d, l.item_id) / l.qty))))
}

export const menuAvailable = (d: StockData, m: Menu) => {
  const p = portions(d, m.id)
  return p == null || p >= m.min_portions
}

/** รายการที่ต้องซื้อของ supplier หนึ่ง: ต่ำกว่า safety stock แล้ว */
export function needList(d: StockData, supplierId: string) {
  return d.items
    .filter((it) => it.active && it.default_supplier_id === supplierId && isLow(d, it))
    .map((it) => {
      const sp = d.products.find((p) => p.item_id === it.id && p.supplier_id === supplierId)
      const short = Math.max(0, it.safety_stock * 2 - qtyOf(d, it.id)) // เติมให้ถึง 2 เท่าของขั้นต่ำ
      const packs = sp && sp.pack_qty > 0 ? Math.ceil(short / sp.pack_qty) : null
      return { item: it, product: sp ?? null, short, packs }
    })
}
