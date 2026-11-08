import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import LangSwitch from '../components/LangSwitch'

export default function Home() {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted">Tap&amp;Tale</span>
          <span className="text-[22px] font-bold">
            {profile ? t('home.hello', { name: profile.display_name }) : 'Tap&Tale'}
          </span>
        </div>
        <LangSwitch />
      </header>

      {profile ? (
        <section className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-4">
          <span className="w-fit rounded-full bg-okbg px-2.5 py-0.5 text-xs font-semibold text-ok">
            {profile.role === 'owner' ? t('home.owner') : t('home.staff')}
          </span>
          <p className="text-sm text-muted">{t('home.soon')}</p>
        </section>
      ) : (
        <p role="alert" className="rounded-lg bg-warnbg px-3 py-2 text-sm text-warn">{t('home.no_profile')}</p>
      )}

      <button type="button" onClick={signOut} className="h-12 rounded-xl border border-[#D9D6D0] bg-white text-[15px] font-semibold">
        {t('home.logout')}
      </button>
    </main>
  )
}
