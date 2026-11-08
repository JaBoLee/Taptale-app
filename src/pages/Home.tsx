import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import LangSwitch from '../components/LangSwitch'

export default function Home() {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()
  const [pending, setPending] = useState(0)
  const isOwner = profile?.role === 'owner' && profile.active

  useEffect(() => {
    if (!isOwner || !supabase) return
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('active', false).is('approved_at', null)
      .then(({ count }) => setPending(count ?? 0))
  }, [isOwner])

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

      {!profile && <p role="alert" className="rounded-lg bg-warnbg px-3 py-2 text-sm text-warn">{t('home.no_profile')}</p>}

      {profile && !profile.active && (
        <section className="flex flex-col gap-1 rounded-[14px] border border-line bg-white p-4">
          <span className="text-[15px] font-semibold">{profile.approved_at ? t('home.disabled_title') : t('home.pending_title')}</span>
          <p className="text-sm text-muted">{profile.approved_at ? t('home.disabled_body') : t('home.pending_body')}</p>
        </section>
      )}

      {profile?.active && (
        <section className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-4">
          <span className="w-fit rounded-full bg-okbg px-2.5 py-0.5 text-xs font-semibold text-ok">
            {profile.role === 'owner' ? t('home.owner') : t('home.staff')}
          </span>
          <p className="text-sm text-muted">{t('home.soon')}</p>
        </section>
      )}

      {isOwner && pending > 0 && (
        <Link to="/users" className="flex items-center justify-between gap-3 rounded-[14px] border border-[#E3C9A4] bg-warnbg p-4 text-warn">
          <span className="text-sm font-semibold">{t('home.pending_owner', { count: pending })}</span>
          <span className="text-sm font-semibold">{t('home.review')}</span>
        </Link>
      )}

      {isOwner && (
        <Link to="/users" className="flex h-12 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-white">
          {t('home.manage_users')}
        </Link>
      )}

      <button type="button" onClick={signOut} className="h-12 rounded-xl border border-[#D9D6D0] bg-white text-[15px] font-semibold">
        {t('home.logout')}
      </button>
    </main>
  )
}
