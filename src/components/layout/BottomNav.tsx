import { NavLink } from 'react-router-dom'
import { Home, Menu, Plus, Receipt, Wallet, type LucideIcon } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { cn } from '../../utils/cn'

function Tab({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink to={to} end={to === '/'}
      className={({ isActive }) => cn('group flex flex-1 flex-col items-center justify-center gap-1 min-h-14 text-[11px] font-semibold transition-colors',
        isActive ? 'text-primary-ink' : 'text-muted')}>
      {({ isActive }) => (
        <>
          <span className={cn('grid place-items-center h-7 w-12 rounded-full transition-colors duration-200', isActive ? 'bg-primary/15' : 'group-active:bg-ink/5')}>
            <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

/** Móvil: barra flotante de vidrio · Inicio · Movimientos · [+] · Cuentas · Más */
export function BottomNav() {
  const { openTx } = useUI()
  return (
    <nav aria-label="Principal" className="md:hidden fixed inset-x-3 z-40 bottom-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="glass shadow-float rounded-[1.75rem] flex items-center px-1.5 max-w-lg mx-auto">
        <Tab to="/" label="Inicio" icon={Home} />
        <Tab to="/movimientos" label="Movimientos" icon={Receipt} />
        <div className="flex-1 flex justify-center">
          <button onClick={() => openTx()} aria-label="Nuevo movimiento"
            className="-mt-8 size-[3.75rem] rounded-[1.35rem] bg-primary text-white grid place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_12px_24px_-8px_rgba(108,76,241,.8)] ring-4 ring-background active:scale-95 transition">
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
        <Tab to="/cuentas" label="Cuentas" icon={Wallet} />
        <Tab to="/mas" label="Más" icon={Menu} />
      </div>
    </nav>
  )
}
