import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel, shiftMonth } from '../../utils/format'

export function MonthNav({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const btn = 'size-11 grid place-items-center rounded-full hover:bg-ink/5'
  return (
    <div className="flex items-center justify-between bg-surface border border-line rounded-2xl px-1">
      <button aria-label="Mes anterior" className={btn} onClick={() => onChange(shiftMonth(month, -1))}><ChevronLeft size={20} /></button>
      <span className="font-semibold capitalize">{monthLabel(month)}</span>
      <button aria-label="Mes siguiente" className={btn} onClick={() => onChange(shiftMonth(month, 1))}><ChevronRight size={20} /></button>
    </div>
  )
}
