import { useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { StatusBadge } from './StatusBadge'
import { PaymentHistory } from './PaymentHistory'
import { formatCOP, formatDate } from '../../utils/format'
import { loanPaid, loanRemaining, loanStatus, percent } from '../../utils/finance'
import type { Loan } from '../../types'
import type { LoanConfig } from './LoanForm'

export function LoanCard({ loan, cfg, onEdit, onPay, onDeletePayment }: {
  loan: Loan; cfg: LoanConfig; onEdit: () => void; onPay: () => void; onDeletePayment: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const status = loanStatus(loan)
  const remaining = loanRemaining(loan)
  const paid = loanPaid(loan)

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-lg truncate">{loan.name}</p>
          {loan.dueDate && <p className="text-xs text-muted">Fecha límite: {formatDate(loan.dueDate)}</p>}
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={status} paidLabel={cfg.paidLabel} />
          <button aria-label="Editar" onClick={onEdit} className="size-10 grid place-items-center rounded-full text-muted hover:bg-ink/5"><Pencil size={16} /></button>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted">{cfg.pendingLabel}</p>
        <p className="text-3xl font-extrabold tabular-nums">{formatCOP(remaining)}</p>
      </div>

      <ProgressBar value={percent(paid, loan.original)} tone={status === 'overdue' ? 'danger' : 'primary'} label={`Progreso de ${loan.name}`} />
      <div className="flex justify-between text-xs text-muted">
        <span>Original {formatCOP(loan.original)}</span><span>Pagado {formatCOP(paid)}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {remaining > 0 && <Button full onClick={onPay}>{cfg.payLabel}</Button>}
        <Button variant="soft" className={remaining > 0 ? '' : 'w-full'} onClick={() => setOpen(!open)} aria-expanded={open}>
          Historial ({loan.payments.length})<ChevronDown size={16} className={open ? 'rotate-180 transition' : 'transition'} />
        </Button>
      </div>
      {open && <PaymentHistory payments={loan.payments} onDelete={onDeletePayment} emptyText="Aún no hay pagos registrados." />}
    </Card>
  )
}
