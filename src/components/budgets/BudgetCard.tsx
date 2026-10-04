import { Card } from '../ui/Card'
import { IconBadge } from '../ui/IconBadge'
import { ProgressBar } from '../ui/ProgressBar'
import { BUDGET_META, budgetState } from './BudgetStatus'
import { formatCOP } from '../../utils/format'
import { percent } from '../../utils/finance'
import type { Category } from '../../types'

export function BudgetCard({ category, limit, spent, onClick, compact }: { category?: Category; limit: number; spent: number; onClick?: () => void; compact?: boolean }) {
  const state = budgetState(spent, limit)
  const meta = BUDGET_META[state]
  const Icon = meta.icon
  const left = limit - spent
  const body = (
    <>
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={category?.icon ?? 'tag'} color={category?.color ?? '#94a3b8'} size={compact ? 36 : 44} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{category?.name ?? 'Categoría'}</p>
          <p className={`text-xs font-medium flex items-center gap-1 ${meta.text}`}><Icon size={13} />{meta.label}</p>
        </div>
        <p className="text-sm text-muted tabular-nums text-right">{formatCOP(spent)} <span className="text-muted/70">/ {formatCOP(limit)}</span></p>
      </div>
      <ProgressBar value={percent(spent, limit)} tone={meta.tone} label={`Presupuesto de ${category?.name ?? 'categoría'}`} />
      <p className="text-xs text-muted mt-2">{left >= 0 ? `Disponible ${formatCOP(left)}` : `Te pasaste ${formatCOP(-left)}`}</p>
    </>
  )
  if (compact) return <div>{body}</div>
  return <Card className="text-left hover:border-secondary transition cursor-pointer" onClick={onClick} role="button" tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter') onClick?.() }}>{body}</Card>
}
