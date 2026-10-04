import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCOP, formatCompact, monthLabel } from '../../utils/format'

export function BalanceLine({ data }: { data: { key: string; balance: number }[] }) {
  const rows = data.map((d) => ({ label: monthLabel(d.key, true), Saldo: d.balance }))
  return (
    <div className="h-56" role="img" aria-label="Gráfica de evolución del saldo">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ left: -8, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="fyloArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c4cf1" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#6c4cf1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ebe9f3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#6b677a" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#6b677a" tickFormatter={formatCompact} width={56} />
          <Tooltip formatter={(v) => formatCOP(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #ebe9f3' }} />
          <Area type="monotone" dataKey="Saldo" stroke="#6c4cf1" strokeWidth={2.5} fill="url(#fyloArea)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
