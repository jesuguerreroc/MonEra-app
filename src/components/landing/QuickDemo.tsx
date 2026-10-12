import { useMemo, useState } from 'react'
import { ArrowLeftRight, ArrowRight, CalendarDays, Landmark, Tag, Zap } from 'lucide-react'
import { IconBadge } from '../ui/IconBadge'
import { inputCls } from '../ui/Field'
import { DEFAULT_CATEGORIES } from '../../constants/categories'
import { parseQuickEntry } from '../../utils/quickEntry'
import { formatCOP, friendlyDate, todayStr } from '../../utils/format'
import { cn } from '../../utils/cn'
import type { Account } from '../../types'

// Cuentas de ejemplo solo para la demostración (no se guarda nada)
const demoAccount = (id: string, name: string, type: Account['type']): Account =>
  ({ id, name, type, initialBalance: 0, currency: 'COP', color: '#6c4cf1', icon: 'wallet', active: true })
const ACCOUNTS = [demoAccount('b', 'Bancolombia', 'bank'), demoAccount('n', 'Nequi', 'digital_wallet'), demoAccount('d', 'Daviplata', 'digital_wallet'), demoAccount('e', 'Efectivo', 'cash')]

const EXAMPLES = ['25k almuerzo nequi', '+1.020.000 salario bancolombia', '200k de bancolombia a nequi', '50 lucas cine ayer', 'uber 18.500 efectivo']
const TYPE_LABEL = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' } as const

/** Demostración en vivo del registro rápido: escribes una frase y ves cómo la entiende MonEra. */
export function QuickDemo() {
  const [text, setText] = useState(EXAMPLES[0])
  const draft = useMemo(() => parseQuickEntry(text, { accounts: ACCOUNTS, categories: DEFAULT_CATEGORIES, transactions: [], today: todayStr() }), [text])
  const cat = DEFAULT_CATEGORIES.find((c) => c.id === draft?.categoryId)
  const acc = (id?: string) => ACCOUNTS.find((a) => a.id === id)?.name ?? '—'

  return (
    <div className="rounded-[2rem] bg-surface/90 border border-line/80 shadow-card p-5 sm:p-7">
      <label htmlFor="demo-input" className="text-sm font-semibold">Escribe un movimiento</label>
      <div className="relative mt-2">
        <Zap size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
        <input id="demo-input" className={cn(inputCls, 'pl-11 text-base')} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Ej: 25k almuerzo nequi" autoComplete="off" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Ejemplos">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setText(ex)} aria-pressed={text === ex}
            className={cn('rounded-full border px-3 min-h-9 text-xs font-medium transition-colors cursor-pointer',
              text === ex ? 'border-primary bg-primary/10 text-primary-ink' : 'border-line text-muted hover:text-ink hover:border-secondary')}>
            {ex}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-ink/[0.03] border border-line/60 p-4 min-h-[148px]" aria-live="polite">
        {!draft ? (
          <p className="text-sm text-muted">Agrega un monto, por ejemplo <b>25k</b>, <b>25 mil</b> o <b>25.000</b>.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {draft.type === 'transfer'
                ? <span className="size-12 rounded-full bg-lavender text-primary grid place-items-center"><ArrowLeftRight size={22} /></span>
                : <IconBadge icon={cat?.icon ?? 'tag'} color={cat?.color ?? '#94a3b8'} size={48} />}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{TYPE_LABEL[draft.type]}</p>
                <p className={cn('text-2xl font-extrabold tracking-tight tabular-nums', draft.type === 'income' && 'text-success')}>
                  {draft.type === 'income' ? '+' : draft.type === 'expense' ? '-' : ''}{formatCOP(draft.amount)}
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2"><dt className="sr-only">Categoría</dt><Tag size={15} className="text-muted" aria-hidden />
                <dd>{draft.type === 'transfer' ? 'Entre tus cuentas' : (cat?.name ?? <span className="text-warning">Sin categoría</span>)}</dd></div>
              <div className="flex items-center gap-2"><dt className="sr-only">Cuenta</dt><Landmark size={15} className="text-muted" aria-hidden />
                <dd>{draft.type === 'transfer' ? <>{acc(draft.accountId)} <ArrowRight size={12} className="inline" /> {acc(draft.toAccountId)}</> : acc(draft.accountId)}</dd></div>
              <div className="flex items-center gap-2"><dt className="sr-only">Fecha</dt><CalendarDays size={15} className="text-muted" aria-hidden />
                <dd>{friendlyDate(draft.date)}</dd></div>
            </dl>
          </>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">Esto es una demostración: no se guarda nada.</p>
    </div>
  )
}
