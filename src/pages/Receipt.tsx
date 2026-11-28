import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, ymd, uploadPhoto, fmtTime, fmtMoney } from '../lib/db'
import { Button, Card, Field, Msg, Page, Pill, Row, inputCls } from '../components/ui'
import { LineEditor, emptyLine, linesTotal, toRows, validLines, type Line } from '../components/LineEditor'

interface R { id: string; supplier_hint: string | null; vendor?: string | null; amount?: number | null; status: 'pending' | 'posted' | 'rejected'; created_at: string }
interface Sup { id: string; name: string; kind: string }

/** รับของเข้าร้าน: พนักงานถ่ายใบเสร็จ + คีย์รายการของที่เข้ามาจริง → สต๊อกเพิ่มทันที · ระบบลงบัญชีรายจ่ายให้ · เจ้าของตรวจทีหลัง */
export default function Receipt() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sups, setSups] = useState<Sup[]>([])
  const [sup, setSup] = useState<string>('')          // supplier id หรือ 'other'
  const [vendor, setVendor] = useState('')
  const [docNo, setDocNo] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine(), to_stock: true }])
  const [list, setList] = useState<R[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    const [{ data }, { data: s }] = await Promise.all([
      sb.from('receipts').select('*').eq('uploaded_by', profile.id).gte('created_at', ymd() + 'T00:00:00+07:00').order('created_at', { ascending: false }),
      sb.from('suppliers').select('id, name, kind').order('name'),
    ])
    setList((data as R[]) ?? [])
    setSups(((s as Sup[]) ?? []).filter((x) => x.kind !== 'market'))
  }, [profile])
  useEffect(() => { load() }, [load])

  const pick = (f: File | null) => {
    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }
  const supName = sup === 'other' ? vendor.trim() : sups.find((s) => s.id === sup)?.name ?? ''
  const total = Number(amount) || linesTotal(lines)

  const send = async () => {
    if (!file) { setMsg({ ok: false, text: t('receipt.need_photo') }); return }
    if (!supName) { setMsg({ ok: false, text: t('receipt.need_vendor') }); return }
    if (!total) { setMsg({ ok: false, text: t('receipt.need_amount') }); return }
    setBusy(true)
    try {
      const path = await uploadPhoto(file, 'receipts')
      const { data: r, error } = await sb.from('receipts').insert({ photo_path: path, supplier_hint: supName, vendor: supName, doc_no: docNo.trim() || null,
        amount: total, kind: 'goods', supplier_id: sup && sup !== 'other' ? sup : null, note: note || null, uploaded_by: profile?.id }).select('id').single()
      if (error) throw error
      if (validLines(lines).length) {
        const { error: le } = await sb.from('ledger_lines').insert(toRows(lines, { receipt_id: (r as { id: string }).id }))
        if (le) throw le
      }
      setMsg({ ok: true, text: t('receipt.sent_goods') })
      pick(null); setDocNo(''); setAmount(''); setNote(''); setLines([{ ...emptyLine(), to_stock: true }]); load()
    } catch { setMsg({ ok: false, text: t('common.save_failed') }) }
    setBusy(false)
  }

  return (
    <Page title={t('receipt.title_goods')} back="/">
      <Card>
        <span className="text-xs text-muted">{t('receipt.goods_hint')}</span>
        <label className="flex h-56 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-ink text-sm text-white">
          {preview ? <img src={preview} alt={t('receipt.preview')} className="h-full w-full object-contain" /> : t('receipt.tap_to_shoot')}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        <div className="flex flex-col gap-1 text-xs text-muted">
          {t('receipt.from')}
          <div className="flex flex-wrap gap-2">
            {[...sups.map((s) => ({ id: s.id, name: s.name })), { id: 'other', name: t('receipt.other') }].map((s) => (
              <button key={s.id} type="button" aria-pressed={sup === s.id} onClick={() => setSup(s.id)}
                className={`min-h-11 rounded-full border px-4 text-[13px] ${sup === s.id ? 'border-ink bg-ink text-white' : 'border-edge bg-white text-ink'}`}>{s.name}</button>
            ))}
          </div>
        </div>
        {sup === 'other' && <Field label={t('acct.vendor')}><input className={inputCls} value={vendor} onChange={(e) => setVendor(e.target.value)} /></Field>}
        <Field label={t('acct.doc_no')}><input className={inputCls} value={docNo} onChange={(e) => setDocNo(e.target.value)} /></Field>
        <LineEditor lines={lines} onChange={setLines} stockDefault />
        <Field label={t('acct.total')} hint={t('acct.total_hint')}>
          <input className={inputCls} inputMode="decimal" value={amount} placeholder={lines.length ? String(linesTotal(lines)) : ''} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t('common.note')}><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <span className="text-xs text-muted">{t('receipt.cash_hint')} <Link to="/shift-close#drawer" className="font-semibold text-tealink underline">{t('close.title')}</Link></span>
        <Msg msg={msg} />
        <Button variant="primary" disabled={busy} onClick={send}>{t('receipt.send_goods')}{total ? ` · ${fmtMoney(total)}` : ''}</Button>
      </Card>
      {list.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('receipt.today')}</span>
          {list.map((r) => (
            <Row key={r.id}>
              <span>{r.vendor || r.supplier_hint} · {fmtTime(r.created_at)}{r.amount ? ` · ${fmtMoney(Number(r.amount))}` : ''}</span>
              <Pill tone={r.status === 'posted' ? 'ok' : r.status === 'rejected' ? 'bad' : 'warn'}>{t(`receipt.st_${r.status}`)}</Pill>
            </Row>
          ))}
        </Card>
      )}
    </Page>
  )
}
