import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuth } from '../../context/AuthContext'

export function MobileHeader() {
  const { user } = useAuth()
  const initial = (user?.displayName ?? user?.email ?? 'F').charAt(0).toUpperCase()
  return (
    <header className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2" aria-label="Ir al inicio">
        <Logo size={34} />
        <span className="text-xl font-extrabold tracking-tight text-primary-ink">MonEra</span>
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Link to="/configuracion" aria-label="Configuración" className="size-10 rounded-full bg-lavender text-primary-ink font-bold grid place-items-center">
          {initial}
        </Link>
      </div>
    </header>
  )
}
