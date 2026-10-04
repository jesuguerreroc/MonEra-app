import { useState } from 'react'
import { PiggyBank, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MonthNav } from '../components/ui/MonthNav'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Skeleton } from '../components/ui/Skeleton'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { BudgetModal } from '../components/budgets/BudgetForm'
import { useData } from '../context/DataContext'
import { formatCOP, monthKey, todayStr } from '../utils/format'
import { expensesByCategory, percent } from '../utils/finance'
import type { Budget } from '../types'

export default function Budgets() {
  const { budgets, transactions, categoryById, loading } = useData()
  const [month, setMonth] = useState(monthKey(todayStr()))
  const [modal, setModal] = useState<{ editing: Budget | null } | null>(null)
  const spentBy = expensesByCategory(transactions, month)
  const totalLimit = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentBy[b.categoryId] ?? 0), 0)

  return (
    <>
      <PageHeader title="Presupuestos" subtitle="Cuánto quieres gastar por categoría cada mes" action={<Button onClick={() => setModal({ editing: null })}><Plus size={18} />Nuevo</Button>} />
      <div className="space-y-4">
        <MonthNav month={month} onChange={setMonth} />
        {loading ? <Skeleton className="h-48 rounded-card" /> : budgets.length === 0 ? (
          <Card><EmptyState icon={PiggyBank} title="Aún no tienes presupuestos" text="Define un límite mensual para categorías como Alimentación o Transporte." actionLabel="Crear presupuesto" onAction={() => setModal({ editing: null })} /></Card>
        ) : (
          <>
            <Card>
              <div className="flex justify-between text-sm mb-2"><span className="font-semibold">Total presupuestado</span><span className="text-muted">{formatCOP(totalSpent)} / {formatCOP(totalLimit)}</span></div>
              <ProgressBar value={percent(totalSpent, totalLimit)} tone={totalSpent > totalLimit ? 'danger' : 'primary'} label="Presupuesto total" />
            </Card>
            <div className="grid gap-3 md:grid-cols-2">
              {budgets.map((b) => <BudgetCard key={b.id} category={categoryById(b.categoryId)} limit={b.amount} spent={spentBy[b.categoryId] ?? 0} onClick={() => setModal({ editing: b })} />)}
            </div>
          </>
        )}
      </div>
      {modal && <BudgetModal editing={modal.editing} onClose={() => setModal(null)} />}
    </>
  )
}
