import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const inputCls = 'h-11 w-full rounded-[10px] border border-[#D9D6D0] bg-white px-3 text-[15px] text-ink'
export const numCls = 'h-11 w-24 rounded-[10px] border border-[#D9D6D0] bg-white px-2 text-center text-base text-ink'

export function Page({ title, subtitle, back, right, children }: { title: string; subtitle?: string; back?: string; right?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-[calc(7rem+var(--badge-h,0px))] pt-5">
      <header className="flex items-center gap-1.5">
        {back && (
          <Link to={back} aria-label={t('common.back')} className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </Link>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-[22px] font-bold leading-tight">{title}</h1>
          {subtitle && <span className="text-[13px] text-muted">{subtitle}</span>}
        </div>
        {right}
      </header>
      {children}
    </main>
  )
}

export function Card({ children, className = '', tone }: { children: ReactNode; className?: string; tone?: 'bad' | 'warn' | 'ok' }) {
  const border = tone === 'bad' ? 'border-[#E8B4B4]' : tone === 'warn' ? 'border-[#E3C9A4]' : tone === 'ok' ? 'border-[#B9DCC6]' : 'border-line'
  return <section className={`flex flex-col gap-2.5 rounded-[14px] border ${border} bg-white p-4 ${className}`}>{children}</section>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger'; small?: boolean }
export function Button({ variant = 'ghost', small, className = '', ...rest }: BtnProps) {
  const base = small ? 'h-9 px-3 text-[13px]' : 'h-12 px-4 text-[15px]'
  const v = variant === 'primary' ? 'bg-ink text-white border-ink' : variant === 'danger' ? 'bg-white text-bad border-[#E8B4B4]' : 'bg-white text-ink border-[#D9D6D0]'
  return <button type="button" {...rest} className={`${base} ${v} inline-flex items-center justify-center gap-2 rounded-xl border font-semibold disabled:opacity-50 ${className}`} />
}

export function LinkButton({ to, children, variant = 'ghost', className = '' }: { to: string; children: ReactNode; variant?: 'primary' | 'ghost'; className?: string }) {
  const v = variant === 'primary' ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-[#D9D6D0]'
  return <Link to={to} className={`flex h-12 items-center justify-center rounded-xl border px-4 text-center text-[15px] font-semibold ${v} ${className}`}>{children}</Link>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      {children}
      {hint && <span className="text-[11px]">{hint}</span>}
    </label>
  )
}

export function Pill({ tone = 'mute', children }: { tone?: 'ok' | 'bad' | 'warn' | 'mute'; children: ReactNode }) {
  const c = tone === 'ok' ? 'bg-okbg text-ok' : tone === 'bad' ? 'bg-badbg text-bad' : tone === 'warn' ? 'bg-warnbg text-warn' : 'bg-[#EFEEEA] text-[#4A4843]'
  return <span className={`inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children}</span>
}

export function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-okbg text-ok' : 'bg-badbg text-bad'}`}>{msg.text}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[14px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>
}

export function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between gap-3 text-sm ${className}`}>{children}</div>
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-xl bg-[#EFEEEA] p-1">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`h-10 flex-1 rounded-[9px] px-2 text-sm font-semibold ${value === o.value ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Loading() {
  return <p className="py-8 text-center text-sm text-muted">…</p>
}
