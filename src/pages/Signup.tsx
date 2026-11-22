import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import LangSwitch from '../components/LangSwitch'
import PasswordInput from '../components/PasswordInput'

const field = 'h-12 rounded-xl border-[1.5px] border-edge bg-field px-3 text-base text-ink'

export default function Signup() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== password2) { setError(t('signup.mismatch')); return }
    setBusy(true)
    setError(null)
    const err = await signUp(username, displayName, password)
    if (err) setError(t(`users.err.${err}`, { defaultValue: t('users.err.failed') }))
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold">{t('signup.title')}</h1>
        <LangSwitch />
      </div>
      <p className="text-sm text-muted">{t('signup.intro')}</p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[13px] text-muted">
          {t('users.display_name')}
          <input className={field} required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-muted">
          {t('login.username')}
          <input className={field} required autoCapitalize="none" autoCorrect="off" autoComplete="username"
            value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
          <span className="text-xs">{t('users.username_hint')}</span>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-muted">
          {t('login.password')}
          <PasswordInput className={field} required minLength={8} autoComplete="new-password" placeholder={t('users.password_hint')}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-muted">
          {t('signup.confirm')}
          <PasswordInput className={field} required minLength={8} autoComplete="new-password"
            value={password2} onChange={(e) => setPassword2(e.target.value)} />
        </label>
        {error && <p role="alert" className="rounded-lg bg-badbg px-3 py-2 text-sm text-bad">{error}</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-ink text-[15px] font-semibold text-white disabled:opacity-60">
          {t('signup.submit')}
        </button>
      </form>
      <Link to="/login" className="flex min-h-11 items-center justify-center text-sm font-semibold text-ink">{t('signup.have_account')}</Link>
    </main>
  )
}
