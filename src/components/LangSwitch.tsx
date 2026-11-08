import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'

const LANGS = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
  { code: 'my', label: 'မြန်မာ' },
] as const

export default function LangSwitch() {
  const { t, i18n } = useTranslation()
  const { setLang } = useAuth()
  return (
    <div role="group" aria-label={t('lang.label')} className="flex gap-0.5 rounded-[10px] bg-[#EFEEEA] p-[3px]">
      {LANGS.map((l) => {
        const on = i18n.language === l.code
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={on}
            className={`h-9 min-w-10 rounded-lg px-2 text-xs font-semibold ${on ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
          >
            {l.label}
          </button>
        )
      })}
    </div>
  )
}
