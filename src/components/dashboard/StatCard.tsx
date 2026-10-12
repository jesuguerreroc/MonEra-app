import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatCOP } from '../../utils/format'
import { cn } from '../../utils/cn'

interface Props { label: string; amount: number; icon: LucideIcon; tone: string; hint?: string; to?: string }

export function StatCard({ label, amount, icon: Icon, tone, hint, to }: Props) {
  const body = (
    <Card className={cn('!p-4 h-full', to && 'hover:border-secondary/60 transition-colors')}>
      <span className={cn('size-9 rounded-xl grid place-items-center', tone)}><Icon size={18} /></span>
      <p className="mt-3 text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-bold tracking-tight tabular-nums">{formatCOP(amount)}</p>
      {hint && <p className="text-xs text-muted mt-0.5 truncate">{hint}</p>}
    </Card>
  )
  return to ? <Link to={to} className="block min-w-0">{body}</Link> : <div className="min-w-0">{body}</div>
}
