import { useMemo, useState } from 'react'
import { ArrowLeftRight, ArrowRight, CircleHelp, SlidersHorizontal, Zap } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { IconBadge } from '../ui/IconBadge'
import { inputCls } from '../ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { saveItem } from '../../services/db'
import { draftMissing, parseQuickEntry } from '../../utils/quickEntry'
import { formatCOP, friendlyDate, todayStr } from '../../utils/format'
import { cn } from '../../utils/cn'

const TYPE_LABEL = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' } as const

const EXAMPLES: [string, string][] = [
  ['25k almuerzo nequi', 'Gasto de $25.000 en Alimentación desde Nequi'],
  ['+1.020.000 salario bancolombia', 'Ingreso (el + o palabras como "salario" o "me pagaron")'],
  ['200k de bancolombia a nequi', 'Transferencia entre tus cuentas'],
  ['50 lucas cine ayer', 'También entiende "mil", "lucas", "palos", "ayer", "el lunes" o "15/10"'],
]

/** Barra de registro rápido: escribes una frase, ves cómo la entendió y guardas con Enter. */
export function QuickAdd() {
  const { user } = useAuth()
  const { accounts, categories, transactions, categoryById, accountById } = useData()
  const { openTx, toast } = useUI()
  const [text, setText] = useState('')
  const [help, setHelp] = useState(false)
  const [saving, setSaving] = useState(false)

  const draft = useMemo(
    () => (text.trim() ? parseQuickEntry(text, { accounts, categories, transactions, today: todayStr() }) : null),
    [text, accounts, categories, transactions],
  )
  const missing = draft ? draftMissing(draft) : null

  function adjust() {
    if (!draft) return
    openTx(undefined, { draft })
    setText('')
  }

  async function save() {
    if (!user || !draft || missing) return
    setSaving(true)
    try {
      await saveItem(user.uid, 'transactions', {
        type: draft.type, amount: draft.amount, accountId: draft.accountId, date: draft.date, description: draft.description,
        ...(draft.type === 'transfer' ? { toAccountId: draft.toAccountId } : { categoryId: draft.categoryId }),
        createdAt: Date.now(),
      })
      toast(`${TYPE_LABEL[draft.type]} guardado: ${formatCOP(draft.amount)}`)
      setText('')
    } catch { toast('No pudimos guardar. Inténtalo de nuevo.', 'error') }
    finally { setSaving(false) }
  }

  const cat = categoryById(draft?.categoryId)
  const from = accountById(draft?.accountId)
  const to = accountById(draft?.toAccountId)

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Zap size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          <input className={cn(inputCls, 'pl-11')} value={text} onChange={(e) => setText(e.target.value)}
            placeholder='Registro rápido: "25k almuerzo nequi"' aria-label="Registro rápido" enterKeyHint="done"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (missing) adjust(); else save() } }} />
        </div>
        <button type="button" onClick={() => setHelp((v) => !v)} aria-expanded={help} aria-label="Cómo escribir"
          className="size-11 grid place-items-center rounded-xl text-muted hover:bg-ink/5 hover:text-ink shrink-0"><CircleHelp size={20} /></button>
      </div>

      {help && (
        <ul className="mt-3 space-y-2 text-sm animate-fade">
          {EXAMPLES.map(([ex, what]) => (
            <li key={ex} className="flex flex-col sm:flex-row sm:items-center gap-x-3">
              <button type="button" onClick={() => setText(ex)} className="font-mono text-[13px] text-primary-ink bg-lavender rounded-lg px-2 py-1 self-start">{ex}</button>
              <span className="text-muted text-xs">{what}</span>
            </li>
          ))}
        </ul>
      )}

      {text.trim() && !draft && <p className="mt-3 text-sm text-muted">Escribe también el monto, por ejemplo <b>25k</b>, <b>25 mil</b> o <b>25.000</b>.</p>}

      {draft && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-ink/[0.03] p-3 animate-fade">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {draft.type === 'transfer'
              ? <span className="size-11 rounded-full bg-lavender text-primary grid place-items-center shrink-0"><ArrowLeftRight size={20} /></span>
              : <IconBadge icon={cat?.icon ?? 'tag'} color={cat?.color ?? '#94a3b8'} />}
            <div className="min-w-0">
              <p className="font-semibold">
                {TYPE_LABEL[draft.type]} · <span className={cn('tabular-nums', draft.type === 'income' && 'text-success')}>{formatCOP(draft.amount)}</span>
              </p>
              <p className="text-xs text-muted truncate">
                {draft.type === 'transfer'
                  ? <>{from?.name ?? '¿Desde?'} <ArrowRight size={12} className="inline" /> {to?.name ?? '¿Hacia?'}</>
                  : <>{cat?.name ?? <span className="text-warning font-medium">Sin categoría</span>} · {from?.name ?? '¿Cuenta?'}</>}
                {' · '}{friendlyDate(draft.date)}{draft.description ? ` · "${draft.description}"` : ''}
              </p>
              {missing && <p className="text-xs text-warning font-medium mt-0.5">{missing}: toca Ajustar</p>}
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Button variant="soft" onClick={adjust} className="flex-1 sm:flex-none !min-h-11"><SlidersHorizontal size={16} />Ajustar</Button>
            <Button onClick={save} loading={saving} disabled={!!missing} className="flex-1 sm:flex-none !min-h-11">Guardar</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
