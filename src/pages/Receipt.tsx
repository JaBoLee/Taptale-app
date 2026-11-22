import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { sb, ymd, uploadPhoto, fmtTime } from '../lib/db'
import { Button, Card, Field, Msg, Page, Pill, Row, inputCls } from '../components/ui'

interface R { id: string; supplier_hint: string | null; status: 'pending' | 'posted' | 'rejected'; created_at: string }

export default function Receipt() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [from, setFrom] = useState('Makro')
  const [note, setNote] = useState('')
  const [list, setList] = useState<R[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const sources = ['Makro', 'Go Wholesale', t('receipt.market'), t('receipt.other')]

  const load = useCallback(async () => {
    if (!profile) return
    const { data } = await sb.from('receipts').select('id, supplier_hint, status, created_at').eq('uploaded_by', profile.id)
      .gte('created_at', ymd() + 'T00:00:00+07:00').order('created_at', { ascending: false })
    setList((data as R[]) ?? [])
  }, [profile])
  useEffect(() => { load() }, [load])

  const pick = (f: File | null) => {
    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const send = async () => {
    if (!file) { setMsg({ ok: false, text: t('receipt.need_photo') }); return }
    setBusy(true)
    try {
      const path = await uploadPhoto(file, 'receipts')
      const { error } = await sb.from('receipts').insert({ photo_path: path, supplier_hint: from, note: note || null, uploaded_by: profile?.id })
      if (error) throw error
      setMsg({ ok: true, text: t('receipt.sent') })
      pick(null); setNote(''); load()
    } catch { setMsg({ ok: false, text: t('common.save_failed') }) }
    setBusy(false)
  }

  return (
    <Page title={t('receipt.title')} back="/">
      <Card>
        <label className="flex h-64 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-ink text-sm text-white">
          {preview ? <img src={preview} alt={t('receipt.preview')} className="h-full w-full object-contain" /> : t('receipt.tap_to_shoot')}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        <div className="flex flex-col gap-1 text-xs text-muted">
          {t('receipt.from')}
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <button key={s} type="button" aria-pressed={from === s} onClick={() => setFrom(s)}
                className={`h-10 rounded-full border px-4 text-[13px] ${from === s ? 'border-ink bg-ink text-white' : 'border-edge bg-white text-ink'}`}>{s}</button>
            ))}
          </div>
        </div>
        <Field label={t('common.note')}><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <Msg msg={msg} />
        <Button variant="primary" disabled={busy} onClick={send}>{t('receipt.send')}</Button>
      </Card>
      {list.length > 0 && (
        <Card>
          <span className="text-[15px] font-semibold">{t('receipt.today')}</span>
          {list.map((r) => (
            <Row key={r.id}>
              <span>{r.supplier_hint} · {fmtTime(r.created_at)}</span>
              <Pill tone={r.status === 'posted' ? 'ok' : r.status === 'rejected' ? 'bad' : 'warn'}>{t(`receipt.st_${r.status}`)}</Pill>
            </Row>
          ))}
        </Card>
      )}
    </Page>
  )
}
