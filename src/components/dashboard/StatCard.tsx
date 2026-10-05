import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatCOP } from '../../utils/format'

export function StatCard({ label, amount, icon: Icon, tone, hint }: { label: string; amount: number; icon: LucideIcon; tone: string; hint?: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 text-muted text-xs font-medium">
        <span className={`size-7 rounded-full grid place-items-center ${tone}`}><Icon size={15} /></span>
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums">{formatCOP(amount)}</p>
      {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
    </Card>
  )
}
