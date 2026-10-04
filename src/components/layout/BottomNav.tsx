import { NavLink } from 'react-router-dom'
import { Home, Menu, Plus, Receipt, Wallet, type LucideIcon } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { cn } from '../../utils/cn'

function Tab({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink to={to} end={to === '/'}
      className={({ isActive }) => cn('flex flex-1 flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-medium transition', isActive ? 'text-primary' : 'text-muted')}>
      <Icon size={22} />{label}
    </NavLink>
  )
}

/** Móvil: Inicio · Movimientos · [+] · Cuentas · Más */
export function BottomNav() {
  const { openTx } = useUI()
  return (
    <nav aria-label="Principal" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center px-2 max-w-lg mx-auto">
        <Tab to="/" label="Inicio" icon={Home} />
        <Tab to="/movimientos" label="Movimientos" icon={Receipt} />
        <div className="flex-1 flex justify-center">
          <button onClick={() => openTx()} aria-label="Nuevo movimiento"
            className="-mt-7 size-16 rounded-full bg-primary text-white grid place-items-center shadow-[0_8px_20px_rgba(108,76,241,.4)] ring-4 ring-background active:scale-95 transition">
            <Plus size={30} strokeWidth={2.5} />
          </button>
        </div>
        <Tab to="/cuentas" label="Cuentas" icon={Wallet} />
        <Tab to="/mas" label="Más" icon={Menu} />
      </div>
    </nav>
  )
}
