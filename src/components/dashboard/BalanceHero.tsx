import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatCOP, formatDate, todayStr } from '../../utils/format'
import { useCountUp } from '../../utils/useCountUp'
import { PrivacyToggle } from '../../context/PrivacyContext'

interface Props { name: string; total: number; accountsCount: number; income: number; expense: number }

/** Encabezado del inicio: saldo total animado y el resumen del mes sobre un degradado de la marca. */
export function BalanceHero({ name, total, accountsCount, income, expense }: Props) {
  const shown = useCountUp(total)
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] text-white p-6 md:p-8 shadow-float
      bg-[radial-gradient(120%_140%_at_0%_0%,#8b6ff7_0%,#6c4cf1_38%,#4930b8_72%,#2e2170_100%)]">
      <div aria-hidden className="absolute -right-16 -top-24 size-72 rounded-full bg-[#60a5fa]/30 blur-3xl -z-10" />
      <div aria-hidden className="absolute -left-10 -bottom-28 size-64 rounded-full bg-secondary/30 blur-3xl -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.12] bg-[radial-gradient(rgba(255,255,255,.9)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />

      <p className="text-white/75 text-sm">Hola, <span className="font-semibold text-white">{name}</span> · {formatDate(todayStr())}</p>
      <p className="text-white/80 text-sm mt-5 flex items-center gap-1">Saldo total
        <PrivacyToggle size={17} className="size-9 -my-2 rounded-full text-white/75 hover:text-white hover:bg-white/15" />
      </p>
      <p className="text-[2.6rem] leading-none md:text-6xl font-extrabold tracking-tight tabular-nums mt-2" aria-label={formatCOP(total)}>{formatCOP(shown)}</p>
      <p className="text-white/65 text-xs mt-2">{accountsCount} {accountsCount === 1 ? 'cuenta activa' : 'cuentas activas'}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
        <div className="rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md p-3">
          <p className="flex items-center gap-1.5 text-xs text-white/80">
            <span className="size-5 rounded-full bg-[#3ccf86]/25 text-[#a7f3d0] grid place-items-center"><ArrowDownLeft size={13} /></span>Ingresos del mes
          </p>
          <p className="mt-1 font-bold tabular-nums">{formatCOP(income)}</p>
        </div>
        <div className="rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md p-3">
          <p className="flex items-center gap-1.5 text-xs text-white/80">
            <span className="size-5 rounded-full bg-white/20 grid place-items-center"><ArrowUpRight size={13} /></span>Gastos del mes
          </p>
          <p className="mt-1 font-bold tabular-nums">{formatCOP(expense)}</p>
        </div>
      </div>
    </section>
  )
}
