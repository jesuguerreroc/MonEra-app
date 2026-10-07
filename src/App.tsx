import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { UIProvider } from './context/UIContext'
import { ThemeProvider } from './context/ThemeContext'
import { AlertsProvider } from './context/AlertsContext'
import AppLayout from './layouts/AppLayout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import Budgets from './pages/Budgets'
import LoansPage, { DEBT_CONFIG, RECEIVABLE_CONFIG } from './pages/LoansPage'
import Goals from './pages/Goals'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import More from './pages/More'
import { Logo } from './components/ui/Logo'

function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center" role="status" aria-label="Cargando MonEra">
      <Logo size={88} animated />
    </div>
  )
}

/** Si no hay sesión muestra login/registro; si hay, la app. */
function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <AuthPage />
  return (
    <DataProvider>
      <UIProvider>
        <AlertsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="movimientos" element={<Transactions />} />
              <Route path="cuentas" element={<Accounts />} />
              <Route path="cuentas/:id" element={<AccountDetail />} />
              <Route path="presupuestos" element={<Budgets />} />
              <Route path="deudas" element={<LoansPage cfg={DEBT_CONFIG} />} />
              <Route path="me-deben" element={<LoansPage cfg={RECEIVABLE_CONFIG} />} />
              <Route path="metas" element={<Goals />} />
              <Route path="reportes" element={<Reports />} />
              <Route path="configuracion" element={<Settings />} />
              <Route path="mas" element={<More />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AlertsProvider>
      </UIProvider>
    </DataProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
