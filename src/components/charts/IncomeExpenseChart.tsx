import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCOP, formatCompact, monthLabel } from '../../utils/format'

export interface MonthPoint { key: string; income: number; expense: number }

export function IncomeExpenseChart({ data }: { data: MonthPoint[] }) {
  const rows = data.map((d) => ({ label: monthLabel(d.key, true), Ingresos: d.income, Gastos: d.expense }))
  return (
    <div className="h-56" role="img" aria-label="Gráfica de ingresos y gastos por mes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={4} margin={{ left: -8, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} stroke="#ebe9f3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#6b677a" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#6b677a" tickFormatter={formatCompact} width={56} />
          <Tooltip cursor={{ fill: '#ede9fe55' }} formatter={(v) => formatCOP(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #ebe9f3' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Gastos" fill="#6c4cf1" radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
