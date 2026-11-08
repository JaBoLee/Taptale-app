import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './lib/auth'
import { isConfigured } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Users from './pages/Users'
import Stock from './pages/Stock'
import Waste from './pages/Waste'
import Recipes from './pages/Recipes'
import MenuEdit from './pages/MenuEdit'
import { ItemEdit, ItemList } from './pages/Items'
import Orders from './pages/Orders'
import Kegs from './pages/Kegs'
import EmptyKegs from './pages/EmptyKegs'
import { MySchedule, Team } from './pages/Schedule'
import ShiftClose from './pages/ShiftClose'
import Receipt from './pages/Receipt'
import Accounting from './pages/Accounting'
import Payroll from './pages/Payroll'
import Settings from './pages/Settings'
import OwnerHome from './pages/OwnerHome'

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
  if (loading) return <div className="flex min-h-full items-center justify-center text-muted">…</div>
  if (!session) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }
  const member = !!profile?.active
  const owner = member && profile?.role === 'owner'
  if (!member) return <Routes><Route path="*" element={<Home />} /></Routes>

  const O = (el: ReactNode) => (owner ? el : <Navigate to="/" replace />)
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/stock/waste" element={<Waste />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/kegs" element={<Kegs />} />
        <Route path="/schedule" element={<MySchedule />} />
        <Route path="/shift-close" element={<ShiftClose />} />
        <Route path="/receipt" element={<Receipt />} />
        <Route path="/owner" element={O(<OwnerHome />)} />
        <Route path="/users" element={O(<Users />)} />
        <Route path="/team" element={O(<Team />)} />
        <Route path="/payroll" element={O(<Payroll />)} />
        <Route path="/orders" element={O(<Orders />)} />
        <Route path="/empty-kegs" element={O(<EmptyKegs />)} />
        <Route path="/accounting" element={O(<Accounting />)} />
        <Route path="/items" element={O(<ItemList />)} />
        <Route path="/items/:id" element={O(<ItemEdit />)} />
        <Route path="/menus/:id" element={O(<MenuEdit />)} />
        <Route path="/settings" element={O(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
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
