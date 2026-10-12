import { Link, NavLink } from 'react-router-dom'
import { ChevronRight, Moon, Plus, Sun } from 'lucide-react'
import { MAIN_NAV } from './nav'
import { Logo } from '../ui/Logo'
import { AlertsBell } from '../alerts/AlertsUI'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/cn'

const iconBtn = 'size-10 inline-flex items-center justify-center rounded-xl text-muted hover:bg-ink/5 hover:text-ink transition'

/** Escritorio: panel flotante de vidrio. Tablet: compacto (solo iconos). */
export function Sidebar() {
  const { user } = useAuth()
  const { openTx } = useUI()
  const { resolved, toggle } = useTheme()
  const dark = resolved === 'dark'
  const name = user?.displayName ?? user?.email?.split('@')[0] ?? 'Tu cuenta'
  const initial = name.charAt(0).toUpperCase()

  return (
    <aside className="hidden md:block sticky top-0 h-dvh w-[88px] lg:w-[17.5rem] shrink-0 p-3">
      <div className="glass shadow-card h-full rounded-[1.75rem] flex flex-col gap-2 p-3 lg:p-4">
        <Link to="/" className="flex items-center justify-center lg:justify-start gap-3 px-1 py-2 lg:px-2" aria-label="Ir al inicio">
          <Logo size={40} animated />
          <span className="hidden lg:block text-2xl font-extrabold tracking-tight text-primary-ink">MonEra</span>
        </Link>

        <button onClick={() => openTx()} aria-label="Nuevo movimiento" title="Nuevo movimiento (N)"
          className="mt-3 mb-3 flex items-center justify-center gap-2 rounded-2xl bg-primary text-white min-h-12 font-semibold hover:bg-primary-dark transition active:scale-[.98] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_10px_24px_-10px_rgba(108,76,241,.9)]">
          <Plus size={20} /><span className="hidden lg:inline">Nuevo movimiento</span>
          <kbd className="hidden lg:inline ml-1 rounded-md bg-white/20 px-1.5 text-[11px] font-semibold">N</kbd>
        </button>

        <nav aria-label="Principal" className="flex flex-col gap-1 overflow-y-auto -mx-1 px-1">
          {MAIN_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} title={label}
              className={({ isActive }) => cn(
                'relative flex items-center justify-center lg:justify-start gap-3 rounded-2xl min-h-11 px-3 text-[15px] font-medium transition-colors',
                isActive ? 'bg-primary/12 text-primary-ink font-semibold' : 'text-muted hover:bg-ink/5 hover:text-ink',
              )}>
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />}
                  <Icon size={20} strokeWidth={isActive ? 2.3 : 2} /><span className="hidden lg:inline">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-3 border-t border-line/70 flex flex-col gap-2">
          <div className="flex flex-col lg:flex-row items-center gap-1">
            <AlertsBell className={iconBtn} />
            <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'} className={iconBtn}>
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <Link to="/configuracion" title="Configuración"
            className="flex items-center justify-center lg:justify-start gap-3 rounded-2xl p-1.5 lg:p-2 hover:bg-ink/5 transition">
            <span className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#8b6ff7] to-primary-dark text-white font-bold grid place-items-center">{initial}</span>
            <span className="hidden lg:block flex-1 min-w-0">
              <span className="block text-sm font-semibold truncate">{name}</span>
              <span className="block text-xs text-muted truncate">{user?.email}</span>
            </span>
            <ChevronRight size={16} className="hidden lg:block text-muted shrink-0" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
