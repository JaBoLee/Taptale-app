import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: BIPEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent })
}

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

/** ปุ่ม "ติดตั้งแอปลงหน้าจอ" — Android/Chrome กดติดตั้งได้ทันที, iPhone แสดงวิธีเพิ่มลงหน้าจอโฮม */
export default function InstallApp() {
  const { t } = useTranslation()
  const [can, setCan] = useState(!!deferred)
  const [hidden, setHidden] = useState(() => {
    try { return standalone() || localStorage.getItem('install_dismissed') === '1' } catch { return standalone() }
  })
  const [showIos, setShowIos] = useState(false)
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); deferred = e as BIPEvent; setCan(true) }
    const done = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', on)
    window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done) }
  }, [])

  if (hidden || (!can && !ios)) return null

  const install = async () => {
    if (ios) { setShowIos(true); return }
    if (!deferred) return
    await deferred.prompt()
    const r = await deferred.userChoice
    if (r.outcome === 'accepted') setHidden(true)
    deferred = null
    setCan(false)
  }
  const dismiss = () => { try { localStorage.setItem('install_dismissed', '1') } catch { /* ignore */ } setHidden(true) }

  return (
    <section className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="flex flex-1 flex-col">
          <span className="text-[15px] font-semibold">{t('install.title')}</span>
          <span className="text-xs text-muted">{t('install.body')}</span>
        </div>
      </div>
      {showIos && <p className="rounded-lg bg-paper p-3 text-sm">{t('install.ios')}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={dismiss} className="h-11 rounded-xl border border-[#D9D6D0] bg-white text-sm font-semibold">{t('install.later')}</button>
        <button type="button" onClick={install} className="h-11 rounded-xl bg-ink text-sm font-semibold text-white">{t('install.btn')}</button>
      </div>
    </section>
  )
}
