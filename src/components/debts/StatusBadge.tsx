import { AlertCircle, CheckCircle2, Clock, CircleDot, type LucideIcon } from 'lucide-react'
import type { LoanStatus } from '../../types'

const META: Record<LoanStatus, { label: string; icon: LucideIcon; cls: string }> = {
  pending: { label: 'Pendiente', icon: Clock, cls: 'bg-ink/[0.06] text-ink' },
  partial: { label: 'Parcial', icon: CircleDot, cls: 'bg-primary/10 text-primary-dark' },
  paid: { label: 'Pagada', icon: CheckCircle2, cls: 'bg-success/10 text-success' },
  overdue: { label: 'Vencida', icon: AlertCircle, cls: 'bg-danger/10 text-danger' },
}

export function StatusBadge({ status, paidLabel }: { status: LoanStatus; paidLabel?: string }) {
  const m = META[status]
  const Icon = m.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
      <Icon size={13} />{status === 'paid' && paidLabel ? paidLabel : m.label}
    </span>
  )
}
