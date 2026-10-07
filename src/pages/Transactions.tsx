import { useMemo, useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MonthNav } from '../components/ui/MonthNav'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { inputCls } from '../components/ui/Field'
import { TransactionRow } from '../components/transactions/TransactionRow'
import { QuickAdd } from '../components/transactions/QuickAdd'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { friendlyDate, formatCOP, monthKey, todayStr } from '../utils/format'
import { monthTotals } from '../utils/finance'
import { cn } from '../utils/cn'
import type { TransactionType } from '../types'

const FILTERS: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' }, { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' }, { value: 'transfer', label: 'Transferencias' },
]

export default function Transactions() {
  const { transactions, loading } = useData()
  const { openTx } = useUI()
  const [month, setMonth] = useState(monthKey(todayStr()))
  const [filter, setFilter] = useState<TransactionType | 'all'>('all')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) =>
      monthKey(t.date) === month && (filter === 'all' || t.type === filter) && (!q || t.description.toLowerCase().includes(q)))
  }, [transactions, month, filter, query])

  const groups = useMemo(() => {
    const map = new Map<string, typeof list>()
    for (const t of list) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return [...map.entries()]
  }, [list])

  const { income, expense } = monthTotals(transactions, month)

  return (
    <>
      <PageHeader title="Movimientos" subtitle="Todo lo que entra y sale de tus cuentas" />
      <div className="space-y-4">
        <QuickAdd />
        <MonthNav month={month} onChange={setMonth} />

        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4"><p className="text-xs text-muted">Ingresos</p><p className="text-lg font-bold text-success">{formatCOP(income)}</p></Card>
          <Card className="!p-4"><p className="text-xs text-muted">Gastos</p><p className="text-lg font-bold">{formatCOP(expense)}</p></Card>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className={cn(inputCls, 'pl-11')} placeholder="Buscar por descripción" aria-label="Buscar movimientos" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="Filtrar por tipo">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} aria-pressed={filter === f.value}
              className={cn('shrink-0 min-h-11 px-4 rounded-full text-sm font-medium border transition',
                filter === f.value ? 'bg-primary text-white border-primary' : 'bg-surface border-line text-muted')}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-72 rounded-card" />
        ) : groups.length === 0 ? (
          <Card>
            <EmptyState icon={Receipt} title="Todavía no tienes movimientos"
              text={query || filter !== 'all' ? 'No hay resultados con esos filtros.' : 'Registra tu primer ingreso o gasto para comenzar a controlar tus finanzas.'}
              actionLabel="Registrar movimiento" onAction={() => openTx()} />
          </Card>
        ) : (
          groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="text-sm font-semibold text-muted mb-1 px-1">{friendlyDate(date)}</h2>
              <Card className="!p-2 divide-y divide-line">
                {items.map((t) => <TransactionRow key={t.id} tx={t} onClick={() => openTx(t)} />)}
              </Card>
            </section>
          ))
        )}
      </div>
    </>
  )
}
