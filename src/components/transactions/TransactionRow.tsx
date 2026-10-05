import { ArrowLeftRight } from 'lucide-react'
import { IconBadge } from '../ui/IconBadge'
import { useData } from '../../context/DataContext'
import { formatCOP } from '../../utils/format'
import { cn } from '../../utils/cn'
import type { Transaction } from '../../types'

interface Props {
  tx: Transaction
  onClick?: () => void
  /** Vista desde una cuenta: las transferencias se ven como salida (−) o entrada (+) de esa cuenta */
  accountId?: string
  /** Saldo de la cuenta después de este movimiento */
  balanceAfter?: number
}

export function TransactionRow({ tx, onClick, accountId, balanceAfter }: Props) {
  const { categoryById, accountById } = useData()
  const cat = categoryById(tx.categoryId)
  const acc = accountById(tx.accountId)
  const to = accountById(tx.toAccountId)
  const isTransfer = tx.type === 'transfer'
  const incoming = tx.type === 'income' || (isTransfer && !!accountId && tx.toAccountId === accountId)
  const outgoing = tx.type === 'expense' || (isTransfer && !!accountId && tx.accountId === accountId)
  const sign = incoming ? '+' : outgoing ? '-' : ''

  let detail: string
  if (isTransfer) {
    detail = !accountId ? `${acc?.name ?? '—'} → ${to?.name ?? '—'}`
      : incoming ? `Transferencia desde ${acc?.name ?? '—'}` : `Transferencia hacia ${to?.name ?? '—'}`
  } else {
    detail = accountId ? (cat?.name ?? 'Sin categoría') : `${cat?.name ?? 'Sin categoría'} · ${acc?.name ?? '—'}`
  }

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3 text-left hover:bg-ink/[0.02] rounded-xl transition min-h-[64px]">
      {isTransfer
        ? <span className="size-11 rounded-full bg-lavender text-primary grid place-items-center shrink-0"><ArrowLeftRight size={20} /></span>
        : <IconBadge icon={cat?.icon ?? 'tag'} color={cat?.color ?? '#94a3b8'} />}
      <span className="flex-1 min-w-0">
        <span className="block font-medium truncate">{tx.description}</span>
        <span className="block text-xs text-muted truncate">{detail}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className={cn('block font-semibold tabular-nums', incoming && 'text-success', isTransfer && !accountId && 'text-muted')}>
          {sign}{formatCOP(tx.amount)}
        </span>
        {balanceAfter !== undefined && <span className="block text-xs text-muted tabular-nums">Saldo {formatCOP(balanceAfter)}</span>}
      </span>
    </button>
  )
}
