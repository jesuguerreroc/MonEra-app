import { useState } from 'react'
import { HandCoins, Plus } from 'lucide-react'
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
import { loanRemaining } from '../utils/finance'
import { formatCOP } from '../utils/format'
import type { Loan } from '../types'

export const DEBT_CONFIG: LoanConfig = {
  col: 'debts', title: 'Deudas', subtitle: 'Lo que debes pagar', nameLabel: 'Acreedor', namePlaceholder: 'Ej: Nu',
  newLabel: 'Nueva deuda', amountLabel: 'Monto de la deuda', pendingLabel: 'Saldo pendiente', payLabel: 'Registrar pago', paidLabel: 'Pagada',
  emptyTitle: 'No tienes deudas registradas', emptyText: 'Registra tarjetas, préstamos o dinero que debes para no perder el control de los pagos.',
}
export const RECEIVABLE_CONFIG: LoanConfig = {
  col: 'receivables', title: 'Me deben', subtitle: 'Dinero que otras personas te deben', nameLabel: 'Persona', namePlaceholder: 'Ej: Juan',
  newLabel: 'Nuevo préstamo', amountLabel: 'Monto prestado', pendingLabel: 'Me debe', payLabel: 'Registrar abono', paidLabel: 'Pagada',
  emptyTitle: 'Nadie te debe dinero', emptyText: 'Cuando prestes dinero, regístralo aquí y anota los abonos que te hagan.',
}

export default function LoansPage({ cfg }: { cfg: LoanConfig }) {
  const { user } = useAuth()
  const data = useData()
  const { toast } = useUI()
  const loans = cfg.col === 'debts' ? data.debts : data.receivables
  const [form, setForm] = useState<{ editing: Loan | null } | null>(null)
  const [paying, setPaying] = useState<Loan | null>(null)
  const sorted = [...loans].sort((a, b) => Number(loanRemaining(b) > 0) - Number(loanRemaining(a) > 0) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  const total = loans.reduce((s, l) => s + loanRemaining(l), 0)

  async function persist(loan: Loan, payments: Loan['payments']) {
    if (!user) return
    await saveItem(user.uid, cfg.col, { ...loan, payments })
  }

  return (
    <>
      <PageHeader title={cfg.title} subtitle={loans.length ? `${cfg.pendingLabel}: ${formatCOP(total)}` : cfg.subtitle}
        action={<Button onClick={() => setForm({ editing: null })}><Plus size={18} />Nueva</Button>} />
      {data.loading ? <Skeleton className="h-56 rounded-card" /> : sorted.length === 0 ? (
        <Card><EmptyState icon={HandCoins} title={cfg.emptyTitle} text={cfg.emptyText} actionLabel={cfg.newLabel} onAction={() => setForm({ editing: null })} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((l) => (
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
          onSave={(p) => persist(paying, [...paying.payments, p])} />
      )}
    </>
  )
}
