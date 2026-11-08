import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'

const icons: Record<string, ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  stock: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>,
  kegs: <><path d="M6 4h12l-1 16H7z" /><path d="M6.5 9h11" /></>,
  recipes: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M9 9h6M9 13h6" /></>,
  schedule: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  owner: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const owner = profile?.role === 'owner'
  const tabs = [
    { to: '/', key: 'home', label: t('nav.home') },
    { to: '/stock', key: 'stock', label: t('nav.stock') },
    { to: '/kegs', key: 'kegs', label: t('nav.kegs') },
    { to: '/recipes', key: 'recipes', label: t('nav.recipes') },
    owner ? { to: '/owner', key: 'owner', label: t('nav.owner') } : { to: '/schedule', key: 'schedule', label: t('nav.schedule') },
  ]
  return (
    <div className="min-h-full">
      {children}
      <nav aria-label={t('nav.label')} className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}
              className={({ isActive }: { isActive: boolean }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${isActive ? 'font-bold text-ink' : 'text-muted'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[tab.key]}</svg>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
