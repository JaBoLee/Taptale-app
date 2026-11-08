import { useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { value: string }

const THAI_OR_MY = /[฀-๿က-႟]/

/** ช่องรหัสผ่านที่กดดูสิ่งที่พิมพ์ได้ และเตือนเมื่อแป้นพิมพ์เป็นภาษาไทย/พม่า */
export default function PasswordInput({ className = '', value, ...rest }: Props) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const wrongKeyboard = THAI_OR_MY.test(value)
  return (
    <span className="flex flex-col gap-1">
      <span className="relative flex">
        <input {...rest} value={value} type={show ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className={`${className} w-full pr-12`} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t('pw.hide') : t('pw.show')} aria-pressed={show}
          className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-muted">
          {show ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-3.1 4.2M6.6 6.6A12 12 0 0 0 2 12c1 2.5 5 7 10 7a9.8 9.8 0 0 0 4.4-1" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          )}
        </button>
      </span>
      {wrongKeyboard && <span role="alert" className="text-xs text-warn">{t('pw.keyboard')}</span>}
    </span>
  )
}
