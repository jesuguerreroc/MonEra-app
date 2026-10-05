import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, PiggyBank, Receipt, Target, Wallet, HandCoins } from 'lucide-react'
import { BalanceHero } from '../components/dashboard/BalanceHero'
import { StatCard } from '../components/dashboard/StatCard'
import { Card, SectionTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageSkeleton } from '../components/ui/Skeleton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { TransactionRow } from '../components/transactions/TransactionRow'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { daysUntil, formatCOP, formatDate, lastMonths, monthKey, todayStr } from '../utils/format'
import { expensesByCategory, goalSaved, loanRemaining, loanStatus, monthSeries, monthTotals, percent } from '../utils/finance'

const seeAll = (to: string) => <Link to={to} className="text-sm font-medium text-primary min-h-11 inline-flex items-center">Ver todo</Link>

export default function Dashboard() {
  const { user } = useAuth()
  const d = useData()
  const { openTx } = useUI()
  const navigate = useNavigate()
  if (d.loading) return <PageSkeleton />

  const month = monthKey(todayStr())
  const { income, expense } = monthTotals(d.transactions, month)
  const saved = d.goals.reduce((s, g) => s + goalSaved(g), 0)
  const owed = d.debts.reduce((s, l) => s + loanRemaining(l), 0)
  const firstName = (user?.displayName ?? user?.email ?? '').split(/[ @]/)[0] || 'tú'
  const activeAccounts = d.accounts.filter((a) => a.active)

  const slices = Object.entries(expensesByCategory(d.transactions, month)).map(([id, value]) => {
    const c = d.categoryById(id)
    return { name: c?.name ?? 'Sin categoría', value, color: c?.color ?? '#94a3b8' }
  })

  const spentBy = expensesByCategory(d.transactions, month)
  const budgets = d.budgets.slice(0, 3)

  const upcoming = d.debts.filter((l) => loanRemaining(l) > 0 && l.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')).slice(0, 4)
  const goals = d.goals.slice(0, 3)

  if (activeAccounts.length === 0) {
    return (
      <>
        <BalanceHero name={firstName} total={0} accountsCount={0} />
        <Card className="mt-4">
          <EmptyState icon={Wallet} title="Empieza creando tu primera cuenta" text="Agrega dónde guardas tu dinero y registra tu primer movimiento: en 5 segundos verás cómo están tus finanzas."
            actionLabel="Crear cuenta" onAction={() => navigate('/cuentas')} />
        </Card>
      </>
    )
  }

  return (
    <div className="space-y-5">
      <BalanceHero name={firstName} total={d.totalBalance} accountsCount={activeAccounts.length} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ingresos del mes" amount={income} icon={ArrowDownLeft} tone="bg-success/10 text-success" />
        <StatCard label="Gastos del mes" amount={expense} icon={ArrowUpRight} tone="bg-primary/10 text-primary" />
        <StatCard label="Dinero ahorrado" amount={saved} icon={PiggyBank} tone="bg-lavender text-primary-ink" />
        <StatCard label="Deudas pendientes" amount={owed} icon={HandCoins} tone="bg-danger/10 text-danger" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Ingresos vs gastos" />
          <IncomeExpenseChart data={monthSeries(d.transactions, lastMonths(6, month))} />
        </Card>
        <Card>
          <SectionTitle title="Gastos por categoría" />
          {slices.length ? <CategoryDonut slices={slices} /> : <p className="text-sm text-muted py-10 text-center">Sin gastos este mes todavía.</p>}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Últimos movimientos" action={seeAll('/movimientos')} />
          {d.transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="Todavía no tienes movimientos" text="Registra tu primer ingreso o gasto para comenzar a controlar tus finanzas." actionLabel="Registrar movimiento" onAction={() => openTx()} />
          ) : (
            <div className="divide-y divide-line">{d.transactions.slice(0, 5).map((t) => <TransactionRow key={t.id} tx={t} onClick={() => openTx(t)} />)}</div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Presupuesto del mes" action={seeAll('/presupuestos')} />
          {budgets.length === 0 ? <p className="text-sm text-muted py-8 text-center">Crea un presupuesto para vigilar tus gastos por categoría.</p> : (
            <div className="space-y-5">{budgets.map((b) => <BudgetCard key={b.id} compact category={d.categoryById(b.categoryId)} limit={b.amount} spent={spentBy[b.categoryId] ?? 0} />)}</div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Metas de ahorro" action={seeAll('/metas')} />
          {goals.length === 0 ? <p className="text-sm text-muted py-8 text-center">Define una meta y ve cómo avanzas.</p> : (
            <div className="space-y-4">
              {goals.map((g) => {
                const s = goalSaved(g)
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1.5"><span className="font-medium flex items-center gap-2"><Target size={15} className="text-primary" />{g.name}</span><span className="text-muted">{percent(s, g.target).toFixed(0)}%</span></div>
                    <ProgressBar value={percent(s, g.target)} label={`Meta ${g.name}`} />
                    <p className="text-xs text-muted mt-1">{formatCOP(s)} de {formatCOP(g.target)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Próximos pagos" action={seeAll('/deudas')} />
          {upcoming.length === 0 ? <p className="text-sm text-muted py-8 text-center">No tienes pagos con fecha pendientes.</p> : (
            <ul className="divide-y divide-line">
              {upcoming.map((l) => {
                const days = daysUntil(l.dueDate as string)
                const overdue = loanStatus(l) === 'overdue'
                return (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <span className="size-10 rounded-full bg-lavender text-primary grid place-items-center"><CalendarClock size={18} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{l.name}</span>
                      <span className={`block text-xs ${overdue ? 'text-danger font-medium' : 'text-muted'}`}>
                        {overdue ? 'Vencida · ' : days === 0 ? 'Vence hoy · ' : days > 0 ? `En ${days} ${days === 1 ? 'día' : 'días'} · ` : ''}{formatDate(l.dueDate as string)}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatCOP(loanRemaining(l))}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
