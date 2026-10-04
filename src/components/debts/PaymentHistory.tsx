import { X } from 'lucide-react'
import { formatCOP, formatDate } from '../../utils/format'
import type { Payment } from '../../types'

export function PaymentHistory({ payments, onDelete, emptyText }: { payments: Payment[]; onDelete: (id: string) => void; emptyText: string }) {
  if (payments.length === 0) return <p className="text-sm text-muted py-2">{emptyText}</p>
  const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <ul className="divide-y divide-line">
      {sorted.map((p) => (
        <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
          <span className="flex-1 min-w-0">
            <span className="block font-medium">{formatCOP(p.amount)}</span>
            <span className="block text-xs text-muted truncate">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}</span>
          </span>
          <button aria-label="Eliminar pago" onClick={() => onDelete(p.id)} className="size-10 grid place-items-center rounded-full text-muted hover:bg-ink/5"><X size={16} /></button>
        </li>
      ))}
    </ul>
  )
}
