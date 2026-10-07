import { NavLink } from 'react-router-dom'
import { Moon, Plus, Sun } from 'lucide-react'
import { MAIN_NAV } from './nav'
import { Logo } from '../ui/Logo'
import { AlertsBell } from '../alerts/AlertsUI'
import { useUI } from '../../context/UIContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/cn'

/** Escritorio: barra lateral completa. Tablet: compacta (solo iconos). */
export function Sidebar() {
  const { openTx } = useUI()
  const { resolved, toggle } = useTheme()
  const dark = resolved === 'dark'
  return (
    <aside className="hidden md:flex sticky top-0 h-dvh w-[76px] lg:w-64 shrink-0 flex-col gap-2 border-r border-line bg-surface p-3 lg:p-4">
      <div className="flex items-center gap-3 px-1 py-2 lg:px-2">
        <Logo size={40} animated />
        <span className="hidden lg:block text-2xl font-extrabold tracking-tight text-primary-ink">MonEra</span>
      </div>

      <button onClick={() => openTx()} aria-label="Nuevo movimiento"
        className="mt-3 mb-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-white min-h-12 font-semibold hover:bg-primary-dark transition active:scale-[.98]">
        <Plus size={20} /><span className="hidden lg:inline">Nuevo movimiento</span>
      </button>

      <nav aria-label="Principal" className="flex flex-col gap-1 overflow-y-auto">
        {MAIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} title={label}
            className={({ isActive }) => cn(
              'flex items-center justify-center lg:justify-start gap-3 rounded-xl min-h-11 px-3 text-[15px] font-medium transition',
              isActive ? 'bg-lavender text-primary-ink' : 'text-muted hover:bg-ink/5 hover:text-ink',
            )}>
            <Icon size={20} /><span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <AlertsBell withLabel className="mt-auto justify-center lg:justify-start rounded-xl min-h-11 px-3 text-[15px] font-medium" />

      <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
        className="flex items-center justify-center lg:justify-start gap-3 rounded-xl min-h-11 px-3 text-[15px] font-medium text-muted hover:bg-ink/5 hover:text-ink transition">
        {dark ? <Sun size={20} /> : <Moon size={20} />}<span className="hidden lg:inline">{dark ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>
    </aside>
  )
}
