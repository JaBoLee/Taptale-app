import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './lib/auth'
import { isConfigured } from './lib/supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import Users from './pages/Users'

function NotConfigured() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-3 px-6">
      <h1 className="text-xl font-bold">{t('setup.title')}</h1>
      <p className="text-sm text-muted">{t('setup.body')}</p>
    </main>
  )
}

function Routed() {
  const { session, profile, loading } = useAuth()
  const isOwner = profile?.role === 'owner'
  if (loading) return <div className="flex min-h-full items-center justify-center text-muted">…</div>
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={session ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/users" element={session && isOwner ? <Users /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isConfigured) return <NotConfigured />
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </AuthProvider>
  )
}
