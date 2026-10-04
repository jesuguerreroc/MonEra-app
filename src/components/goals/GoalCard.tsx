import { useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { PaymentHistory } from '../debts/PaymentHistory'
import { daysUntil, formatCOP, formatDate } from '../../utils/format'
import { goalSaved, percent } from '../../utils/finance'
import type { Goal } from '../../types'

export function GoalCard({ goal, onEdit, onContribute, onDeleteContribution }: {
  goal: Goal; onEdit: () => void; onContribute: () => void; onDeleteContribution: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const saved = goalSaved(goal)
  const pct = percent(saved, goal.target)
  const missing = Math.max(0, goal.target - saved)
  const months = goal.targetDate ? Math.max(1, Math.ceil(daysUntil(goal.targetDate) / 30)) : 0

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-lg truncate">{goal.name}</p>
          {goal.targetDate && <p className="text-xs text-muted">Para el {formatDate(goal.targetDate)}</p>}
        </div>
        <button aria-label="Editar meta" onClick={onEdit} className="size-10 grid place-items-center rounded-full text-muted hover:bg-ink/5"><Pencil size={16} /></button>
      </div>
      <div className="flex items-end justify-between">
        <div><p className="text-xs text-muted">Ahorrado</p><p className="text-2xl font-extrabold tabular-nums">{formatCOP(saved)}</p></div>
        <p className="text-xl font-bold text-primary">{pct.toFixed(1).replace('.', ',')}%</p>
      </div>
      <ProgressBar value={pct} tone={pct >= 100 ? 'success' : 'primary'} label={`Progreso de ${goal.name}`} />
      <p className="text-xs text-muted">
        {pct >= 100 ? '¡Meta cumplida!' : `Objetivo ${formatCOP(goal.target)} · Faltan ${formatCOP(missing)}`}
        {pct < 100 && goal.targetDate && daysUntil(goal.targetDate) > 0 ? ` · Ahorra ${formatCOP(Math.ceil(missing / months))} al mes` : ''}
      </p>
      <div className="flex gap-2">
        <Button full onClick={onContribute}>Agregar aporte</Button>
        <Button variant="soft" onClick={() => setOpen(!open)} aria-expanded={open}>Aportes ({goal.contributions.length})<ChevronDown size={16} className={open ? 'rotate-180 transition' : 'transition'} /></Button>
      </div>
      {open && <PaymentHistory payments={goal.contributions} onDelete={onDeleteContribution} emptyText="Aún no hay aportes." />}
    </Card>
  )
}
