import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Wallet } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { IconBadge } from '../components/ui/IconBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { AccountModal } from '../components/accounts/AccountForm'
import { ACCOUNT_TYPES } from '../constants/categories'
import { useData } from '../context/DataContext'
import { formatCOP } from '../utils/format'
import { cn } from '../utils/cn'
import type { Account, AccountType } from '../types'

/** Orden y nombre de cada grupo en la página */
const GROUPS: { type: AccountType; label: string }[] = [
  { type: 'bank', label: 'Cuentas bancarias' },
  { type: 'digital_wallet', label: 'Billeteras digitales' },
  { type: 'savings', label: 'Ahorros e inversión' },
  { type: 'cash', label: 'Efectivo' },
  { type: 'credit_card', label: 'Tarjetas de crédito' },
  { type: 'other', label: 'Otras' },
]

function AccountCard({ a, balance }: { a: Account; balance: number }) {
  return (
    <Link to={`/cuentas/${a.id}`} aria-label={`Ver movimientos de ${a.name}`} className="block min-w-0 group">
      <Card className={cn('!p-4 flex items-center gap-3.5 group-hover:border-secondary/60 transition-colors', !a.active && 'opacity-60')}>
        <IconBadge icon={a.icon} color={a.color} size={46} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{a.name}</p>
          <p className="text-xs text-muted truncate">{ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}{a.active ? '' : ' · Inactiva'}</p>
        </div>
        <p className={cn('font-bold tabular-nums shrink-0', balance < 0 && 'text-danger')}>{formatCOP(balance)}</p>
        <ChevronRight size={18} className="text-muted shrink-0 -ml-1 group-hover:translate-x-0.5 transition-transform" />
      </Card>
    </Link>
  )
}

/** Barra que muestra en qué cuentas está tu dinero (solo saldos positivos de cuentas activas) */
function Distribution({ accounts, balances }: { accounts: Account[]; balances: Record<string, number> }) {
  const parts = accounts.filter((a) => a.active && (balances[a.id] ?? 0) > 0)
    .map((a) => ({ a, v: balances[a.id] })).sort((x, y) => y.v - x.v)
  const total = parts.reduce((s, p) => s + p.v, 0)
  if (!total) return null
  return (
    <div className="mt-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/[0.06]" role="img"
        aria-label={`Distribución: ${parts.map((p) => `${p.a.name} ${Math.round((p.v / total) * 100)}%`).join(', ')}`}>
        {parts.map((p) => <span key={p.a.id} style={{ width: `${(p.v / total) * 100}%`, background: p.a.color }} className="h-full first:rounded-l-full last:rounded-r-full border-r-2 border-surface last:border-r-0" />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {parts.slice(0, 5).map((p) => (
          <li key={p.a.id} className="flex items-center gap-1.5 text-muted">
            <span className="size-2.5 rounded-full" style={{ background: p.a.color }} />
            <span className="text-ink font-medium">{p.a.name}</span> {Math.round((p.v / total) * 100)}%
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Accounts() {
  const { accounts, balances, totalBalance, loading } = useData()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader title="Cuentas" subtitle={accounts.length ? 'Toca una cuenta para ver sus movimientos' : 'Dónde guardas tu dinero'}
        action={<Button onClick={() => setCreating(true)}><Plus size={18} />Nueva</Button>} />
      {loading ? <Skeleton className="h-40 rounded-card" /> : accounts.length === 0 ? (
        <Card>
          <EmptyState icon={Wallet} title="Aún no tienes cuentas" text="Crea tu primera cuenta (Bancolombia, Nequi, Efectivo…) para empezar a registrar movimientos."
            actionLabel="Crear cuenta" onAction={() => setCreating(true)} />
        </Card>
      ) : (
        <div className="space-y-7">
          <Card>
            <p className="text-sm text-muted">Saldo total</p>
            <p className={cn('text-3xl md:text-4xl font-extrabold tracking-tight tabular-nums mt-1', totalBalance < 0 && 'text-danger')}>{formatCOP(totalBalance)}</p>
            <Distribution accounts={accounts} balances={balances} />
          </Card>

          {GROUPS.map(({ type, label }) => {
            const list = accounts.filter((a) => a.type === type)
            if (!list.length) return null
            const subtotal = list.filter((a) => a.active).reduce((s, a) => s + (balances[a.id] ?? 0), 0)
            return (
              <section key={type} aria-label={label}>
                <div className="flex items-baseline justify-between gap-3 mb-2.5 px-1">
                  <h2 className="text-sm font-semibold text-muted">{label}</h2>
                  <span className={cn('text-sm font-semibold tabular-nums', subtotal < 0 ? 'text-danger' : 'text-ink')}>{formatCOP(subtotal)}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((a) => <AccountCard key={a.id} a={a} balance={balances[a.id] ?? 0} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
      {creating && <AccountModal open editing={null} onClose={() => setCreating(false)} />}
    </>
  )
}
