import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Receipt } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { IconBadge } from '../components/ui/IconBadge'
import { MonthNav } from '../components/ui/MonthNav'
import { PageSkeleton } from '../components/ui/Skeleton'
import { TransactionRow } from '../components/transactions/TransactionRow'
import { AccountModal } from '../components/accounts/AccountForm'
import { ACCOUNT_TYPES } from '../constants/categories'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { accountHistory, type AccountEntry } from '../utils/finance'
import { formatCOP, friendlyDate, monthKey, todayStr } from '../utils/format'
import { cn } from '../utils/cn'

type Filter = 'all' | 'in' | 'out' | 'transfer'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' }, { value: 'in', label: 'Entradas' },
  { value: 'out', label: 'Salidas' }, { value: 'transfer', label: 'Transferencias' },
]

/** Historial de una cuenta: todo lo que entró y salió de ella, con el saldo después de cada movimiento. */
export default function AccountDetail() {
  const { id = '' } = useParams()
  const { accountById, balances, transactions, loading } = useData()
  const { openTx } = useUI()
  const [month, setMonth] = useState(monthKey(todayStr()))
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState(false)

  const account = accountById(id)
  const history = useMemo(() => (account ? accountHistory(account, transactions) : []), [account, transactions])

  const inMonth = history.filter((e) => monthKey(e.tx.date) === month)
  const entries = inMonth.filter((e) =>
    filter === 'all' || (filter === 'transfer' ? e.tx.type === 'transfer' : filter === 'in' ? e.delta > 0 : e.delta < 0))
  const totalIn = inMonth.reduce((s, e) => s + Math.max(0, e.delta), 0)
  const totalOut = inMonth.reduce((s, e) => s + Math.max(0, -e.delta), 0)

  const byDate = new Map<string, AccountEntry[]>()
  for (const e of entries) byDate.set(e.tx.date, [...(byDate.get(e.tx.date) ?? []), e])
  const groups = [...byDate.entries()]

  if (loading) return <PageSkeleton />
  if (!account) return <Navigate to="/cuentas" replace /> // p. ej. si se acaba de eliminar

  const balance = balances[account.id] ?? 0
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label

  return (
    <>
      <Link to="/cuentas" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink min-h-11 mb-2">
        <ArrowLeft size={16} /> Cuentas
      </Link>

      <div className="space-y-4">
        <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <IconBadge icon={account.icon} color={account.color} size={56} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">{account.name}</h1>
              <p className="text-sm text-muted">{typeLabel}{account.active ? '' : ' · Inactiva'}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-muted">Saldo actual</p>
            <p className={cn('text-3xl font-extrabold tracking-tight tabular-nums', balance < 0 && 'text-danger')}>{formatCOP(balance)}</p>
            <p className="text-xs text-muted mt-0.5">Saldo inicial {formatCOP(account.initialBalance)}</p>
          </div>
        </Card>

        <div className="flex gap-3">
          {account.active && (
            <Button className="flex-1 sm:flex-none" onClick={() => openTx(undefined, { accountId: account.id })}><Plus size={18} />Movimiento</Button>
          )}
          <Button variant="soft" className="flex-1 sm:flex-none" onClick={() => setEditing(true)}><Pencil size={16} />Editar cuenta</Button>
        </div>

        <MonthNav month={month} onChange={setMonth} />

        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4"><p className="text-xs text-muted">Entradas</p><p className="text-lg font-bold text-success tabular-nums">{formatCOP(totalIn)}</p></Card>
          <Card className="!p-4"><p className="text-xs text-muted">Salidas</p><p className="text-lg font-bold tabular-nums">{formatCOP(totalOut)}</p></Card>
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="Filtrar movimientos">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} aria-pressed={filter === f.value}
              className={cn('shrink-0 min-h-11 px-4 rounded-full text-sm font-medium border transition',
                filter === f.value ? 'bg-primary text-white border-primary' : 'bg-surface border-line text-muted')}>
              {f.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <Card>
            <EmptyState icon={Receipt} title="Sin movimientos"
              text={history.length === 0 ? 'Esta cuenta aún no tiene movimientos.' : 'No hay movimientos en este mes con ese filtro.'}
              actionLabel={account.active ? 'Registrar movimiento' : undefined} onAction={() => openTx(undefined, { accountId: account.id })} />
          </Card>
        ) : (
          groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="text-sm font-semibold text-muted mb-1 px-1">{friendlyDate(date)}</h2>
              <Card className="!p-2 divide-y divide-line">
                {items.map((e) => <TransactionRow key={e.tx.id} tx={e.tx} accountId={account.id} balanceAfter={e.balanceAfter} onClick={() => openTx(e.tx)} />)}
              </Card>
            </section>
          ))
        )}
      </div>

      {editing && <AccountModal open editing={account} onClose={() => setEditing(false)} />}
    </>
  )
}
