import { useMemo, useState } from 'react'
import { ArrowLeftRight, CheckCircle2, Plus, Repeat, ShieldAlert, Zap } from 'lucide-react'
import { Card, SectionTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { IconBadge } from '../components/ui/IconBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { RecurringModal } from '../components/recurring/RecurringForm'
import { PayRecurringModal, RecurringRow } from '../components/recurring/RecurringDue'
import { useData } from '../context/DataContext'
import { dueLabel, frequencyLabel, isUpToDate, monthlyEquivalent, nextOccurrence, recurringAgenda, type RecurringItem } from '../utils/recurring'
import { formatCOP, shiftDay, todayStr } from '../utils/format'
import { cn } from '../utils/cn'
import type { Recurring } from '../types'

export default function RecurringPage() {
  const { recurring, transactions, loading, recurringBlocked, categoryById, accountById } = useData()
  const [form, setForm] = useState<{ editing: Recurring | null } | null>(null)
  const [paying, setPaying] = useState<RecurringItem | null>(null)
  const today = todayStr()
  const txIds = useMemo(() => new Set(transactions.map((t) => t.id)), [transactions])
  const agenda = useMemo(() => recurringAgenda(recurring, txIds, today, 14), [recurring, txIds, today])

  const active = recurring.filter((r) => r.active)
  const monthlyOut = active.filter((r) => r.type === 'expense').reduce((s, r) => s + monthlyEquivalent(r, transactions), 0)
  const monthlyIn = active.filter((r) => r.type === 'income').reduce((s, r) => s + monthlyEquivalent(r, transactions), 0)
  const sorted = [...recurring].sort((a, b) => Number(b.active) - Number(a.active) || (nextOccurrence(a, today) ?? '9').localeCompare(nextOccurrence(b, today) ?? '9'))

  return (
    <>
      <PageHeader title="Pagos fijos" subtitle="Lo que se repite cada mes: te lo recordamos y lo registras con un toque"
        action={<Button onClick={() => setForm({ editing: null })} disabled={recurringBlocked}><Plus size={18} />Nuevo</Button>} />

      {recurringBlocked && (
        <Card className="mb-5 flex items-start gap-3 border-warning/40">
          <ShieldAlert className="text-warning shrink-0 mt-0.5" size={22} />
          <div className="text-sm">
            <p className="font-semibold">Falta un paso en Firebase</p>
            <p className="text-muted mt-1">Para usar los pagos fijos hay que publicar las reglas de seguridad actualizadas (archivo <code>firestore.rules</code>). Tus demás datos funcionan normal.</p>
          </div>
        </Card>
      )}

      {loading ? <Skeleton className="h-56 rounded-card" /> : recurring.length === 0 ? (
        <Card>
          <EmptyState icon={Repeat} title="Aún no tienes pagos fijos"
            text="Agrega el arriendo, internet, celular, luz, agua, gas o tu salario. Cada mes te aparecerán para registrarlos con un toque."
            actionLabel={recurringBlocked ? undefined : 'Crear pago fijo'} onAction={() => setForm({ editing: null })} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="!p-4"><p className="text-xs text-muted">Gastos fijos al mes</p><p className="text-xl font-bold tabular-nums mt-0.5">{formatCOP(monthlyOut)}</p></Card>
            <Card className="!p-4"><p className="text-xs text-muted">Ingresos fijos al mes</p><p className="text-xl font-bold tabular-nums text-success mt-0.5">{formatCOP(monthlyIn)}</p></Card>
          </div>

          {agenda.length > 0 && (
            <Card>
              <SectionTitle title="Por confirmar y próximos 14 días" />
              <ul className="divide-y divide-line -my-1">
                {agenda.map((i) => <RecurringRow key={i.r.id + i.date} item={i} onPay={setPaying} />)}
              </ul>
            </Card>
          )}

          <section aria-label="Todos los pagos fijos">
            <h2 className="text-sm font-semibold text-muted mb-2.5 px-1">Todos ({recurring.length})</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sorted.map((r) => {
                const cat = categoryById(r.categoryId)
                const next = nextOccurrence(r, shiftDay(today, 1))
                const upToDate = isUpToDate(r, txIds, today)
                return (
                  <button key={r.id} onClick={() => setForm({ editing: r })} className="text-left min-w-0">
                    <Card className={cn('!p-4 flex items-center gap-3.5 hover:border-secondary/60 transition-colors h-full', !r.active && 'opacity-60')}>
                      {r.type === 'transfer'
                        ? <span className="size-11 rounded-full bg-lavender text-primary grid place-items-center shrink-0"><ArrowLeftRight size={20} /></span>
                        : <IconBadge icon={cat?.icon ?? 'repeat'} color={cat?.color ?? '#94a3b8'} />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1.5">
                          {r.name}{r.auto && <Zap size={13} className="text-primary shrink-0" aria-label="Automático" />}
                        </p>
                        <p className="text-xs text-muted truncate">{frequencyLabel(r)} · {accountById(r.accountId)?.name ?? '—'}</p>
                        <p className="text-xs mt-0.5 truncate">
                          {!r.active ? <span className="text-muted">Pausado</span>
                            : upToDate ? <span className="text-success inline-flex items-center gap-1"><CheckCircle2 size={12} />Al día{next ? ` · próximo ${dueLabel(next).text.toLowerCase()}` : ''}</span>
                            : <span className="text-danger font-medium">Pendiente por confirmar</span>}
                        </p>
                      </div>
                      <span className={cn('font-bold tabular-nums shrink-0', r.type === 'income' && 'text-success')}>
                        {r.variable ? <span className="text-sm text-muted font-medium">Variable</span> : formatCOP(r.amount)}
                      </span>
                    </Card>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {form && <RecurringModal editing={form.editing} onClose={() => setForm(null)} />}
      {paying && <PayRecurringModal item={paying} onClose={() => setPaying(null)} />}
    </>
  )
}
