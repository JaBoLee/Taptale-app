import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const inputCls = 'h-12 w-full rounded-xl border-[1.5px] border-edge bg-field px-3 text-[15px] text-ink'
export const numCls = 'h-12 w-24 rounded-xl border-[1.5px] border-edge bg-field px-2 text-right text-[17px] font-semibold text-ink'

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
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <span className="text-[13px] text-muted">{subtitle}</span>}
        </div>
        {right}
      </header>
      {children}
    </main>
  )
}

export function Card({ children, className = '', tone }: { children: ReactNode; className?: string; tone?: 'bad' | 'warn' | 'ok' | 'dark' }) {
  const bg = tone === 'bad' ? 'bg-badbg' : tone === 'warn' ? 'bg-amberbg' : tone === 'ok' ? 'bg-okbg' : tone === 'dark' ? 'bg-ink text-white' : 'bg-white shadow-[0_1px_0_var(--color-line)]'
  return <section className={`flex flex-col gap-2.5 rounded-[18px] p-4 ${bg} ${className}`}>{children}</section>
}

type Variant = 'primary' | 'ghost' | 'danger' | 'dark' | 'solidDanger'
const variantCls = (v: Variant) =>
  v === 'primary' ? 'bg-amber text-ink border-amber'
  : v === 'dark' ? 'bg-ink text-white border-ink'
  : v === 'danger' ? 'bg-white text-danger border-badline'
  : v === 'solidDanger' ? 'bg-danger text-white border-danger'
  : 'bg-white text-ink border-edge'
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }
export function Button({ variant = 'ghost', small, className = '', ...rest }: BtnProps) {
  const base = small ? 'min-h-11 px-3 text-[13px]' : 'min-h-12 px-4 text-[15px]'
  return <button type="button" {...rest} className={`${base} ${variantCls(variant)} inline-flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] font-semibold disabled:opacity-50 ${className}`} />
}

export function LinkButton({ to, children, variant = 'ghost', className = '' }: { to: string; children: ReactNode; variant?: Variant; className?: string }) {
  return <Link to={to} className={`flex min-h-12 items-center justify-center rounded-[14px] border-[1.5px] px-4 text-center text-[15px] font-semibold ${variantCls(variant)} ${className}`}>{children}</Link>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  )
}

export function Pill({ tone = 'mute', children }: { tone?: 'ok' | 'bad' | 'warn' | 'mute'; children: ReactNode }) {
  const c = tone === 'ok' ? 'bg-tealbg text-tealink' : tone === 'bad' ? 'bg-badbg text-bad' : tone === 'warn' ? 'bg-amberbg text-amberink' : 'bg-sand text-ink2'
  return <span className={`inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${c}`}>{children}</span>
}

export function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return <p role="status" className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${msg.ok ? 'bg-tealbg text-tealink' : 'bg-badbg text-bad'}`}>{msg.text}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[18px] border-[1.5px] border-dashed border-edge px-4 py-6 text-center text-sm text-muted">{children}</p>
}

export function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between gap-3 text-sm ${className}`}>{children}</div>
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-[14px] bg-sand p-1">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`min-h-10 flex-1 rounded-[11px] px-2 text-sm font-semibold ${value === o.value ? 'bg-ink text-white' : 'text-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Loading() {
  return <p className="py-8 text-center text-sm text-muted">…</p>
}
