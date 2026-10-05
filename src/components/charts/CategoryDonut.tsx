import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCOP } from '../../utils/format'
import { tooltipStyle } from './chartTheme'

export interface Slice { name: string; value: number; color: string }

/** Dona + lista con montos y porcentajes (así no dependes solo del color). */
export function CategoryDonut({ slices, max = 6 }: { slices: Slice[]; max?: number }) {
  const sorted = [...slices].sort((a, b) => b.value - a.value)
  const shown = sorted.slice(0, max)
  const rest = sorted.slice(max).reduce((s, x) => s + x.value, 0)
  if (rest > 0) shown.push({ name: 'Otras', value: rest, color: '#cbd5e1' })
  const total = shown.reduce((s, x) => s + x.value, 0)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="h-44 w-44 shrink-0" role="img" aria-label="Gráfica de gastos por categoría">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
              {shown.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip formatter={(v) => formatCOP(Number(v))} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {shown.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="text-muted tabular-nums">{Math.round((s.value / total) * 100)}%</span>
            <span className="font-semibold tabular-nums w-24 text-right">{formatCOP(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
