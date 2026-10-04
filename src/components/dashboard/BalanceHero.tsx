import { formatCOP, formatDate, todayStr } from '../../utils/format'

export function BalanceHero({ name, total, accountsCount }: { name: string; total: number; accountsCount: number }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-primary-dark text-white p-6 md:p-8">
      <div aria-hidden className="absolute -right-10 -top-12 size-52 rounded-full bg-primary/50" />
      <div aria-hidden className="absolute right-16 -bottom-16 size-40 rounded-full bg-secondary/20" />
      <div className="relative">
        <p className="text-white/70 text-sm">Hola, {name} · {formatDate(todayStr())}</p>
        <p className="text-white/80 text-sm mt-4">Saldo total</p>
        <p className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums mt-1">{formatCOP(total)}</p>
        <p className="text-white/60 text-xs mt-2">{accountsCount} {accountsCount === 1 ? 'cuenta activa' : 'cuentas activas'}</p>
      </div>
    </section>
  )
}
