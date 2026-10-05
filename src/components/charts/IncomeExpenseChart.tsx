import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCOP, formatCompact, monthLabel } from '../../utils/format'
import { AXIS, GRID, tooltipStyle } from './chartTheme'

export interface MonthPoint { key: string; income: number; expense: number }

export function IncomeExpenseChart({ data }: { data: MonthPoint[] }) {
  const rows = data.map((d) => ({ label: monthLabel(d.key, true), Ingresos: d.income, Gastos: d.expense }))
  return (
    <div className="h-56" role="img" aria-label="Gráfica de ingresos y gastos por mes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={4} margin={{ left: -8, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke={AXIS} tickFormatter={formatCompact} width={56} />
          <Tooltip cursor={{ fill: 'var(--color-lavender)', fillOpacity: 0.6 }} formatter={(v) => formatCOP(Number(v))} contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Gastos" fill="#6c4cf1" radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
