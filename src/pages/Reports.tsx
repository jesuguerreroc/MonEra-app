import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, SectionTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MonthNav } from '../components/ui/MonthNav'
import { PageHeader } from '../components/ui/PageHeader'
import { PageSkeleton } from '../components/ui/Skeleton'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { BalanceLine } from '../components/charts/BalanceLine'
import { useData } from '../context/DataContext'
import { formatCOP, lastMonths, monthKey, monthLabel, shiftMonth, todayStr } from '../utils/format'
import { balanceSeries, expensesByCategory, monthSeries, monthTotals } from '../utils/finance'

function Delta({ label, now, before, goodWhenUp }: { label: string; now: number; before: number; goodWhenUp: boolean }) {
  const diff = now - before
  const pct = before > 0 ? Math.round((diff / before) * 100) : null
  const good = diff === 0 ? null : (diff > 0) === goodWhenUp
  return (
    <Card className="!p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold tabular-nums">{formatCOP(now)}</p>
      <p className={`text-xs font-medium mt-0.5 ${good === null ? 'text-muted' : good ? 'text-success' : 'text-danger'}`}>
        {diff === 0 ? 'Igual que el mes anterior' : `${diff > 0 ? '▲ Subió' : '▼ Bajó'} ${pct !== null ? `${Math.abs(pct)}%` : formatCOP(Math.abs(diff))} vs. mes anterior`}
      </p>
    </Card>
  )
}

export default function Reports() {
  const d = useData()
  const [month, setMonth] = useState(monthKey(todayStr()))
  if (d.loading) return <PageSkeleton />
  if (d.transactions.length === 0) {
    return (
      <>
        <PageHeader title="Reportes" subtitle="Entiende a dónde va tu dinero" />
        <Card><EmptyState icon={BarChart3} title="Aún no hay datos para analizar" text="Cuando registres movimientos verás aquí tus reportes mensuales." /></Card>
      </>
    )
  }

  const months = lastMonths(6, month)
  const now = monthTotals(d.transactions, month)
  const prev = monthTotals(d.transactions, shiftMonth(month, -1))
  const savingsRate = now.income > 0 ? Math.round(((now.income - now.expense) / now.income) * 100) : null
  const slices = Object.entries(expensesByCategory(d.transactions, month)).map(([id, value]) => {
    const c = d.categoryById(id)
    return { name: c?.name ?? 'Sin categoría', value, color: c?.color ?? '#94a3b8' }
  })

  return (
    <>
      <PageHeader title="Reportes" subtitle="Entiende a dónde va tu dinero" />
      <div className="space-y-5">
        <MonthNav month={month} onChange={setMonth} />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="!p-4 col-span-2 lg:col-span-1 bg-lavender border-transparent">
            <p className="text-xs text-primary-dark/70">Tasa de ahorro · <span className="capitalize">{monthLabel(month)}</span></p>
            <p className="text-3xl font-extrabold text-primary-dark">{savingsRate === null ? '—' : `${savingsRate}%`}</p>
            <p className="text-xs text-primary-dark/70 mt-0.5">
              {savingsRate === null ? 'Registra ingresos para calcularla.' : savingsRate < 0 ? 'Gastaste más de lo que ingresó.' : `Guardaste ${formatCOP(now.income - now.expense)} este mes.`}
            </p>
          </Card>
          <Delta label="Ingresos" now={now.income} before={prev.income} goodWhenUp />
          <Delta label="Gastos" now={now.expense} before={prev.expense} goodWhenUp={false} />
        </div>

        <Card><SectionTitle title="Ingresos y gastos por mes" /><IncomeExpenseChart data={monthSeries(d.transactions, months)} /></Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><SectionTitle title="Gastos por categoría" />{slices.length ? <CategoryDonut slices={slices} /> : <p className="text-sm text-muted py-10 text-center">Sin gastos en este mes.</p>}</Card>
          <Card><SectionTitle title="Evolución del saldo" /><BalanceLine data={balanceSeries(d.accounts, d.transactions, months)} /></Card>
        </div>
      </div>
    </>
  )
}
