import { BarChart3, CreditCard, HandCoins, Home, PiggyBank, Receipt, Settings, Target, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon }

export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/movimientos', label: 'Movimientos', icon: Receipt },
  { to: '/cuentas', label: 'Cuentas', icon: Wallet },
  { to: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
  { to: '/deudas', label: 'Deudas', icon: CreditCard },
  { to: '/me-deben', label: 'Me deben', icon: HandCoins },
  { to: '/metas', label: 'Metas de ahorro', icon: Target },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

/** Lo que aparece en la pantalla "Más" del móvil */
export const MORE_NAV: NavItem[] = MAIN_NAV.filter((n) => !['/', '/movimientos', '/cuentas'].includes(n.to))

