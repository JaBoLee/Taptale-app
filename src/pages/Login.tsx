import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import LangSwitch from '../components/LangSwitch'
import PasswordInput from '../components/PasswordInput'
import InstallApp from '../components/InstallApp'

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(username, password)
    if (err) setError(err === 'not_configured' ? t('setup.title') : err === 'bad_login' ? t('login.bad_login') : `${t('login.other_error')} (${err.slice(6)})`)
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col">
      <div className="flex flex-col gap-7 bg-ink px-5 pb-16 pt-5 text-white">
        <div className="flex justify-end"><LangSwitch /></div>
        <div className="flex items-center gap-3.5">
          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px] bg-amber text-xl font-bold text-ink">T&amp;T</div>
          <div className="flex flex-col">
            <h1 className="text-[28px] font-bold leading-tight">Tap&amp;Tale</h1>
            <p className="text-sm text-herosub">{t('app.tagline')}</p>
          </div>
        </div>
      </div>
      <div className="-mt-10 flex flex-col gap-3.5 px-4 pb-10">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-[18px] bg-white p-[18px] shadow-[0_1px_0_var(--color-line),0_8px_24px_rgba(30,27,22,0.06)]">
        <h2 className="text-xl font-bold">{t('login.submit')}</h2>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          {t('login.username')}
          <input
            className="h-12 rounded-xl border-[1.5px] border-edge bg-field px-3 text-base text-ink"
            autoComplete="username" autoCapitalize="none" autoCorrect="off" required
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          {/[฀-๿က-႟]/.test(username) && <span role="alert" className="text-xs text-warn">{t('pw.keyboard')}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          {t('login.password')}
          <PasswordInput
            className="h-12 rounded-xl border-[1.5px] border-edge bg-field px-3 text-base text-ink"
            autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p role="alert" className="rounded-xl bg-badbg px-3 py-2 text-sm font-medium text-bad">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-12 rounded-[14px] bg-amber text-[15px] font-semibold text-ink disabled:opacity-60">
          {busy ? t('login.working') : t('login.submit')}
        </button>
      </form>
      <Link to="/signup" className="flex min-h-12 items-center justify-center rounded-[14px] border-[1.5px] border-edge bg-white text-[15px] font-semibold text-ink">{t('signup.cta')}</Link>
      <InstallApp />
      <p className="text-center text-[13px] text-muted">{t('login.forgot')}</p>
      </div>
    </main>
  )
}
