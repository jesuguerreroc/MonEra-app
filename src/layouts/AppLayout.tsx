import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CloudOff } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { BottomNav } from '../components/layout/BottomNav'
import { MobileHeader } from '../components/layout/MobileHeader'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { useOnline } from '../utils/pwa'

export default function AppLayout() {
  const { error } = useData()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { openTx } = useUI()
  const online = useOnline()

  // Atajo "Nuevo movimiento" del ícono de la app instalada (abre /?nuevo=1)
  useEffect(() => {
    if (new URLSearchParams(search).has('nuevo')) {
      openTx()
      navigate(pathname, { replace: true })
    }
  }, [search, pathname, openTx, navigate])

  // Computador: la tecla N abre "Nuevo movimiento" (si no estás escribiendo en otro campo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('[role="dialog"]')) return
      e.preventDefault()
      openTx()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openTx])
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileHeader />
        <main key={pathname} className="animate-rise mx-auto max-w-6xl px-4 md:px-8 pt-2 md:pt-8 pb-32 md:pb-12">
          {!online && (
            <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-warning/10 text-warning px-4 py-3 text-sm font-medium">
              <CloudOff size={18} className="shrink-0" />Sin conexión. Puedes seguir registrando: se guardará y se subirá solo al volver internet.
            </div>
          )}
          {error && <div role="alert" className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm font-medium">{error}</div>}
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
