import { ArrowLeftRight } from 'lucide-react'
import { IconBadge } from '../ui/IconBadge'
import { useData } from '../../context/DataContext'
import { formatCOP } from '../../utils/format'
import { cn } from '../../utils/cn'
import type { Transaction } from '../../types'

export function TransactionRow({ tx, onClick }: { tx: Transaction; onClick?: () => void }) {
  const { categoryById, accountById } = useData()
  const cat = categoryById(tx.categoryId)
  const acc = accountById(tx.accountId)
  const to = accountById(tx.toAccountId)
  const isTransfer = tx.type === 'transfer'
  const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3 text-left hover:bg-ink/[0.02] rounded-xl transition min-h-[64px]">
      {isTransfer
        ? <span className="size-11 rounded-full bg-lavender text-primary grid place-items-center shrink-0"><ArrowLeftRight size={20} /></span>
        : <IconBadge icon={cat?.icon ?? 'tag'} color={cat?.color ?? '#94a3b8'} />}
      <span className="flex-1 min-w-0">
        <span className="block font-medium truncate">{tx.description}</span>
        <span className="block text-xs text-muted truncate">
          {isTransfer ? `${acc?.name ?? '—'} → ${to?.name ?? '—'}` : `${cat?.name ?? 'Sin categoría'} · ${acc?.name ?? '—'}`}
        </span>
      </span>
      <span className={cn('font-semibold tabular-nums shrink-0', tx.type === 'income' && 'text-success', isTransfer && 'text-muted')}>
        {sign}{formatCOP(tx.amount)}
      </span>
    </button>
  )
}
