import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, CalendarClock } from 'lucide-react'
import { Card, SectionTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { IconBadge } from '../ui/IconBadge'
import { Modal } from '../ui/Modal'
import { MoneyInput } from '../ui/MoneyInput'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { registerOccurrence, skipOccurrence } from '../../services/recurring'
import { dueLabel, lastAmount, recurringAgenda, type RecurringItem } from '../../utils/recurring'
import { formatCOP, formatDateShort, todayStr } from '../../utils/format'
import { cn } from '../../utils/cn'

/** Ventana para registrar un pago fijo: confirma o cambia el monto y la cuenta */
export function PayRecurringModal({ item, onClose }: { item: RecurringItem; onClose: () => void }) {
  const { user } = useAuth()
  const { accounts, transactions } = useData()
  const { toast } = useUI()
  const { r, date } = item
  const [amount, setAmount] = useState(r.variable ? 0 : r.amount)
  const [accountId, setAccountId] = useState(r.accountId)
  const [saving, setSaving] = useState(false)
  const prev = lastAmount(r, transactions)

  async function save() {
    if (!user) return
    if (amount <= 0) return toast('Escribe el monto', 'error')
    setSaving(true)
    try { await registerOccurrence(user.uid, r, date, amount, accountId); toast(`${r.name} registrado`); onClose() }
    catch { toast('No pudimos registrarlo.', 'error'); setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Registrar ${r.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted">Pago del {formatDateShort(date)}{r.variable && prev ? ` · La última vez fueron ${formatCOP(prev)}` : ''}</p>
        <MoneyInput big autoFocus value={amount} onChange={setAmount} />
        {r.type !== 'transfer' && (
          <Field label={r.type === 'income' ? 'Cuenta donde llegó' : 'Cuenta con la que pagaste'}>
            <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.filter((a) => a.active || a.id === r.accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
        <Button full loading={saving} onClick={save}>Registrar</Button>
      </div>
    </Modal>
  )
}

/** Fila de un pago pendiente o próximo, con sus acciones */
export function RecurringRow({ item, onPay }: { item: RecurringItem; onPay: (i: RecurringItem) => void }) {
  const { user } = useAuth()
  const { categoryById, accountById } = useData()
  const { toast } = useUI()
  const [busy, setBusy] = useState(false)
  const { r, date, state } = item
  const cat = categoryById(r.categoryId)
  const due = dueLabel(date)

  async function quickPay() {
    if (!user) return
    if (r.variable) return onPay(item)
    setBusy(true)
    try { await registerOccurrence(user.uid, r, date, r.amount); toast(`${r.name} registrado: ${formatCOP(r.amount)}`) }
    catch { toast('No pudimos registrarlo.', 'error') }
    finally { setBusy(false) }
  }
  async function skip() {
    if (!user) return
    try { await skipOccurrence(user.uid, r, date); toast(`${r.name}: omitido esta vez`) }
    catch { toast('No pudimos omitirlo.', 'error') }
  }

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {r.type === 'transfer'
          ? <span className="size-11 rounded-full bg-lavender text-primary grid place-items-center shrink-0"><ArrowLeftRight size={20} /></span>
          : <IconBadge icon={cat?.icon ?? 'repeat'} color={cat?.color ?? '#94a3b8'} />}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{r.name}</p>
          <p className="text-xs truncate">
            <span className={cn(due.urgent ? 'text-danger font-semibold' : 'text-muted')}>{due.text}</span>
            <span className="text-muted"> · {accountById(r.accountId)?.name ?? '—'}</span>
          </p>
        </div>
        <span className={cn('font-semibold tabular-nums shrink-0', r.type === 'income' && 'text-success')}>
          {r.variable ? <span className="text-muted text-sm font-medium">Variable</span> : formatCOP(r.amount)}
        </span>
      </div>
      {state === 'due' && (
        <div className="flex gap-2 sm:shrink-0">
          <Button variant="ghost" onClick={skip} className="!min-h-10 flex-1 sm:flex-none text-muted">Omitir</Button>
          {!r.variable && <Button variant="soft" onClick={() => onPay(item)} className="!min-h-10 flex-1 sm:flex-none">Cambiar</Button>}
          <Button onClick={quickPay} loading={busy} className="!min-h-10 flex-1 sm:flex-none">{r.variable ? 'Escribir monto' : 'Registrar'}</Button>
        </div>
      )}
    </li>
  )
}

/** Inicio: pagos fijos que ya tocan y los de los próximos 7 días */
export function RecurringDue() {
  const { recurring, transactions } = useData()
  const [paying, setPaying] = useState<RecurringItem | null>(null)
  const items = useMemo(() => recurringAgenda(recurring, new Set(transactions.map((t) => t.id)), todayStr()), [recurring, transactions])
  if (items.length === 0) return null
  const dueCount = items.filter((i) => i.state === 'due').length

  return (
    <Card>
      <SectionTitle title={dueCount ? `Pagos fijos por confirmar (${dueCount})` : 'Próximos pagos fijos'}
        action={<Link to="/pagos-fijos" className="text-sm font-medium text-primary-ink min-h-11 inline-flex items-center">Ver todos</Link>} />
      <ul className="divide-y divide-line -my-1">
        {items.slice(0, 5).map((i) => <RecurringRow key={i.r.id + i.date} item={i} onPay={setPaying} />)}
      </ul>
      {items.length > 5 && <p className="text-xs text-muted mt-2 flex items-center gap-1.5"><CalendarClock size={14} />Y {items.length - 5} más en Pagos fijos</p>}
      {paying && <PayRecurringModal item={paying} onClose={() => setPaying(null)} />}
    </Card>
  )
}
