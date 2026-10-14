import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { markSummarySeen, wasSummarySeen } from '../../utils/summarySeen'
import { monthKey, monthLabel, shiftMonth, todayStr } from '../../utils/format'

/** Primeros 7 días del mes: invita a ver el resumen del mes anterior (si hubo movimientos y no lo has visto). */
export function SummaryBanner() {
  const { transactions } = useData()
  const today = todayStr()
  const prev = shiftMonth(monthKey(today), -1)
  const [hidden, setHidden] = useState(() => wasSummarySeen(prev))
  const count = transactions.filter((t) => monthKey(t.date) === prev).length
  if (hidden || Number(today.slice(8)) > 7 || count < 3) return null

  const name = monthLabel(prev).replace(/ de \d{4}$/, '')
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] p-4 pr-3 text-white shadow-float flex items-center gap-3
      bg-[radial-gradient(120%_140%_at_0%_0%,#3b82f6_0%,#6c4cf1_50%,#4930b8_100%)]">
      <span className="size-11 rounded-2xl bg-white/15 ring-1 ring-white/25 grid place-items-center shrink-0"><Sparkles size={20} /></span>
      <div className="flex-1 min-w-0">
        <p className="font-bold">Tu resumen de {name} está listo</p>
        <p className="text-xs text-white/80">Mira cómo te fue: en qué gastaste, cuánto ahorraste y más.</p>
      </div>
      <Link to={`/resumen/${prev}`} className="shrink-0 inline-flex items-center rounded-xl bg-white text-primary-dark font-semibold min-h-10 px-4 text-sm hover:bg-white/90 transition-colors">Verlo</Link>
      <button onClick={() => { markSummarySeen(prev); setHidden(true) }} aria-label="Ocultar" className="size-9 shrink-0 grid place-items-center rounded-full hover:bg-white/15"><X size={18} /></button>
    </div>
  )
}
