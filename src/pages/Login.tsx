import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import LangSwitch from '../components/LangSwitch'
import PasswordInput from '../components/PasswordInput'

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
    if (err) setError(err === 'not_configured' ? t('setup.title') : t('login.bad_login'))
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-7 px-6 py-10">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-ink text-[22px] font-bold text-white">T&amp;T</div>
        <h1 className="text-[26px] font-bold">Tap&amp;Tale</h1>
        <p className="text-[13px] text-muted">{t('app.tagline')}</p>
      </div>
      <div className="flex justify-center"><LangSwitch /></div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[13px] text-muted">
          {t('login.username')}
          <input
            className="h-12 rounded-[10px] border border-[#D9D6D0] bg-white px-3 text-base text-ink"
            autoComplete="username" autoCapitalize="none" autoCorrect="off" required
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          {/[฀-๿က-႟]/.test(username) && <span role="alert" className="text-xs text-warn">{t('pw.keyboard')}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-muted">
          {t('login.password')}
          <PasswordInput
            className="h-12 rounded-[10px] border border-[#D9D6D0] bg-white px-3 text-base text-ink"
            autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p role="alert" className="rounded-lg bg-badbg px-3 py-2 text-sm text-bad">{error}</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-ink text-[15px] font-semibold text-white disabled:opacity-60">
          {busy ? t('login.working') : t('login.submit')}
        </button>
      </form>
      <p className="text-center text-[13px] text-muted">{t('login.forgot')}</p>
    </main>
  )
}
