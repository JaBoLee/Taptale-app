import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import th from './th.json'
import en from './en.json'
import my from './my.json'

let saved = 'th'
try { saved = localStorage.getItem('lang') || 'th' } catch { /* ignore */ }

i18n.use(initReactI18next).init({
  resources: { th: { translation: th }, en: { translation: en }, my: { translation: my } },
  lng: saved,
  fallbackLng: 'th',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => { document.documentElement.lang = lng })

export default i18n
