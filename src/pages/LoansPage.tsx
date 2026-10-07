import { useState } from 'react'
import { CheckCircle2, HandCoins, History, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { LoanCard } from '../components/debts/LoanCard'
import { LoanModal, type LoanConfig } from '../components/debts/LoanForm'
import { PaymentModal } from '../components/debts/PaymentModal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { saveItem } from '../services/db'
import { loanRemaining, loanSettledOn } from '../utils/finance'
import { formatCOP } from '../utils/format'
import { cn } from '../utils/cn'
import type { Loan } from '../types'

export const DEBT_CONFIG: LoanConfig = {
  col: 'debts', title: 'Deudas', subtitle: 'Lo que debes pagar', nameLabel: 'Acreedor', namePlaceholder: 'Ej: Nu',
  newLabel: 'Nueva deuda', amountLabel: 'Monto de la deuda', pendingLabel: 'Saldo pendiente', payLabel: 'Registrar pago', paidLabel: 'Pagada',
  emptyTitle: 'No tienes deudas registradas', emptyText: 'Registra tarjetas, préstamos o dinero que debes para no perder el control de los pagos.',
  allSettledText: 'No tienes deudas pendientes. Las que terminaste de pagar están en el historial.',
  historyEmptyText: 'Cuando termines de pagar una deuda, aparecerá aquí.',
  settledToast: (name) => `¡Terminaste de pagar ${name}! Pasó al historial.`,
}
export const RECEIVABLE_CONFIG: LoanConfig = {
  col: 'receivables', title: 'Me deben', subtitle: 'Dinero que otras personas te deben', nameLabel: 'Persona', namePlaceholder: 'Ej: Juan',
  newLabel: 'Nuevo préstamo', amountLabel: 'Monto prestado', pendingLabel: 'Me debe', payLabel: 'Registrar abono', paidLabel: 'Pagada',
  emptyTitle: 'Nadie te debe dinero', emptyText: 'Cuando prestes dinero, regístralo aquí y anota los abonos que te hagan.',
  allSettledText: 'Nadie te debe dinero ahora mismo. Los préstamos que ya te pagaron están en el historial.',
  historyEmptyText: 'Cuando alguien te pague todo, aparecerá aquí.',
  settledToast: (name) => `¡${name} te pagó todo! Pasó al historial.`,
}

export default function LoansPage({ cfg }: { cfg: LoanConfig }) {
  const { user } = useAuth()
  const data = useData()
  const { toast } = useUI()
  const loans = cfg.col === 'debts' ? data.debts : data.receivables
  const [form, setForm] = useState<{ editing: Loan | null } | null>(null)
  const [paying, setPaying] = useState<Loan | null>(null)
  const [tab, setTab] = useState<'pending' | 'settled'>('pending')
  // Pendientes: aún tienen saldo. Historial: ya se pagó todo (se calcula con los pagos, no se guarda nada aparte)
  const pending = loans.filter((l) => loanRemaining(l) > 0)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  const settled = loans.filter((l) => loanRemaining(l) === 0)
    .sort((a, b) => (loanSettledOn(b) ?? '').localeCompare(loanSettledOn(a) ?? ''))
  const shown = tab === 'pending' ? pending : settled
  const total = loans.reduce((s, l) => s + loanRemaining(l), 0)

  async function persist(loan: Loan, payments: Loan['payments']) {
    if (!user) return
    await saveItem(user.uid, cfg.col, { ...loan, payments })
  }

  return (
    <>
      <PageHeader title={cfg.title} subtitle={loans.length ? `${cfg.pendingLabel}: ${formatCOP(total)}` : cfg.subtitle}
        action={<Button onClick={() => setForm({ editing: null })}><Plus size={18} />Nueva</Button>} />
      {!data.loading && loans.length > 0 && (
        <div role="tablist" aria-label={cfg.title} className="inline-grid grid-cols-2 p-1 rounded-2xl bg-ink/[0.05] mb-4 w-full sm:w-auto">
          {([['pending', 'Pendientes', pending.length], ['settled', 'Historial', settled.length]] as const).map(([value, label, count]) => (
            <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
              className={cn('min-h-11 px-5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2',
                tab === value ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(23,21,31,.12)]' : 'text-muted hover:text-ink')}>
              {label}<span className="rounded-full bg-ink/[0.07] px-2 py-0.5 text-xs tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      )}
      {data.loading ? <Skeleton className="h-56 rounded-card" /> : loans.length === 0 ? (
        <Card><EmptyState icon={HandCoins} title={cfg.emptyTitle} text={cfg.emptyText} actionLabel={cfg.newLabel} onAction={() => setForm({ editing: null })} /></Card>
      ) : shown.length === 0 ? (
        <Card>
          {tab === 'pending'
            ? <EmptyState icon={CheckCircle2} title="¡Todo al día!" text={cfg.allSettledText} actionLabel="Ver historial" onAction={() => setTab('settled')} />
            : <EmptyState icon={History} title="Historial vacío" text={cfg.historyEmptyText} />}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((l) => (
            <LoanCard key={l.id} loan={l} cfg={cfg} onEdit={() => setForm({ editing: l })} onPay={() => setPaying(l)}
              onDeletePayment={async (id) => {
                try { await persist(l, l.payments.filter((p) => p.id !== id)); toast('Pago eliminado') }
                catch { toast('No pudimos eliminarlo.', 'error') }
              }} />
          ))}
        </div>
      )}
      {form && <LoanModal cfg={cfg} editing={form.editing} onClose={() => setForm(null)} />}
      {paying && (
        <PaymentModal title={cfg.payLabel} max={loanRemaining(paying)} onClose={() => setPaying(null)}
          successText={(p) => (p.amount >= loanRemaining(paying) ? cfg.settledToast(paying.name) : 'Registrado')}
          onSave={(p) => persist(paying, [...paying.payments, p])} />
      )}
    </>
  )
}
