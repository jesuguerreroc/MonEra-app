import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { AlertsBell } from '../alerts/AlertsUI'
import { PrivacyToggle } from '../../context/PrivacyContext'
import { useAuth } from '../../context/AuthContext'

export function MobileHeader() {
  const { user } = useAuth()
  const initial = (user?.displayName ?? user?.email ?? 'M').charAt(0).toUpperCase()
  return (
    <header className="md:hidden sticky top-0 z-30 glass border-x-0 border-t-0 !border-b-line/60 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5" aria-label="Ir al inicio">
        <Logo size={34} />
        <span className="text-xl font-extrabold tracking-tight text-primary-ink">MonEra</span>
      </Link>
      <div className="flex items-center gap-0.5">
        <PrivacyToggle className="size-11 rounded-full text-muted hover:bg-ink/5 hover:text-ink" />
        <AlertsBell className="size-11 rounded-full" />
        <ThemeToggle className="size-11" />
        <Link to="/configuracion" aria-label="Configuración"
          className="ml-1 size-10 rounded-full bg-gradient-to-br from-[#8b6ff7] to-primary-dark text-white font-bold grid place-items-center shadow-[0_4px_12px_-4px_rgba(108,76,241,.7)]">
          {initial}
        </Link>
      </div>
    </header>
  )
}
