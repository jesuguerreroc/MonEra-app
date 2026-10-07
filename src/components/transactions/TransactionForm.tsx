import { useState } from 'react'
import { ArrowRight, Trash2, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { IconBadge } from '../ui/IconBadge'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { removeItem, saveItem } from '../../services/db'
import { todayStr } from '../../utils/format'
import { parseQuickEntry } from '../../utils/quickEntry'
import type { TxPreset } from '../../context/UIContext'
import { cn } from '../../utils/cn'
import type { Transaction, TransactionType } from '../../types'

const TYPES: { value: TransactionType; label: string; active: string }[] = [
  { value: 'expense', label: 'Gasto', active: 'bg-danger text-white dark:text-background' },
  { value: 'income', label: 'Ingreso', active: 'bg-success text-white dark:text-background' },
  { value: 'transfer', label: 'Transferir', active: 'bg-primary text-white' },
]

export function TransactionModal({ open, onClose, editing, preset }: { open: boolean; onClose: () => void; editing: Transaction | null; preset?: TxPreset }) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <TransactionForm editing={editing} preset={preset} onDone={onClose} />
    </Modal>
  )
}

function TransactionForm({ editing, preset, onDone }: { editing: Transaction | null; preset?: TxPreset; onDone: () => void }) {
  const { user } = useAuth()
  const { accounts, categories, transactions } = useData()
  const { toast, confirm } = useUI()

  const options = accounts.filter((a) => a.active || a.id === editing?.accountId || a.id === editing?.toAccountId)
  const draft = preset?.draft
  const presetAccountId = draft?.accountId ?? preset?.accountId
  const [type, setType] = useState<TransactionType>(editing?.type ?? draft?.type ?? 'expense')
  const [amount, setAmount] = useState(editing?.amount ?? draft?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? draft?.categoryId ?? '')
  const [description, setDescription] = useState(editing?.description ?? draft?.description ?? '')
  const [accountId, setAccountId] = useState(editing?.accountId ?? options.find((a) => a.id === presetAccountId)?.id ?? options[0]?.id ?? '')
  const [toAccountId, setToAccountId] = useState(editing?.toAccountId ?? draft?.toAccountId ?? '')
  const [date, setDate] = useState(editing?.date ?? draft?.date ?? todayStr())
  const [quick, setQuick] = useState('')

  // Registro rápido: lo que escribes llena el formulario al instante
  function onQuick(text: string) {
    setQuick(text)
    const d = parseQuickEntry(text, { accounts: options, categories, transactions, today: todayStr() })
    if (!d) return
    setType(d.type); setAmount(d.amount); setCategoryId(d.categoryId ?? ''); setDescription(d.description); setDate(d.date)
    if (d.accountId) setAccountId(d.accountId)
    setToAccountId(d.toAccountId ?? '')
  }
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)

  if (options.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted mb-4">Antes de registrar movimientos necesitas al menos una cuenta (Bancolombia, Nequi, Efectivo…).</p>
        <Link to="/cuentas" onClick={onDone} className="inline-flex items-center justify-center rounded-xl bg-primary text-white font-semibold min-h-12 px-5">Crear mi primera cuenta</Link>
      </div>
    )
  }

  const catList = categories.filter((c) => c.type === type)

  async function save() {
    if (!user) return
    if (amount <= 0) return toast('Escribe un monto mayor a $0', 'error')
    if (!accountId) return toast('Elige una cuenta', 'error')
    if (type === 'transfer') {
      if (!toAccountId) return toast('Elige la cuenta destino', 'error')
      if (toAccountId === accountId) return toast('Origen y destino deben ser distintas', 'error')
    } else if (!categoryId) return toast('Elige una categoría', 'error')

    const catName = categories.find((c) => c.id === categoryId)?.name ?? ''
    const tx = {
      ...(editing ? { id: editing.id } : {}),
      type, amount, accountId, date,
      description: (description.trim() || (type === 'transfer' ? 'Transferencia' : catName)).slice(0, 120),
      ...(type === 'transfer' ? { toAccountId } : { categoryId }),
      ...(notes.trim() ? { notes: notes.trim().slice(0, 300) } : {}),
      createdAt: editing?.createdAt ?? Date.now(),
    }
    setSaving(true)
    try {
      await saveItem(user.uid, 'transactions', tx)
      toast(editing ? 'Movimiento actualizado' : 'Movimiento guardado')
      onDone()
    } catch {
      toast('No pudimos guardar. Inténtalo de nuevo.', 'error')
      setSaving(false)
    }
  }

  async function remove() {
    if (!user || !editing) return
    const ok = await confirm({ title: 'Eliminar movimiento', message: 'Esta acción actualizará tus saldos y no se puede deshacer.' })
    if (!ok) return
    try { await removeItem(user.uid, 'transactions', editing.id); toast('Movimiento eliminado'); onDone() }
    catch { toast('No pudimos eliminarlo.', 'error') }
  }

  return (
    <div className="space-y-4">
      {!editing && (
        <div className="relative">
          <Zap size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          <input className={cn(inputCls, 'pl-11 bg-lavender/50 border-primary/25')} value={quick} autoFocus={!draft}
            placeholder='Escribe rápido: "25k almuerzo nequi"' aria-label="Registro rápido"
            onChange={(e) => onQuick(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save() } }} />
        </div>
      )}

      <div role="tablist" aria-label="Tipo de movimiento" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-ink/[0.05]">
        {TYPES.map((t) => (
          <button key={t.value} role="tab" aria-selected={type === t.value}
            onClick={() => { setType(t.value); setCategoryId('') }}
            className={cn('min-h-11 rounded-xl text-sm font-semibold transition', type === t.value ? t.active : 'text-muted')}>
            {t.label}
          </button>
        ))}
      </div>

      <MoneyInput big autoFocus={!!editing} value={amount} onChange={setAmount} />

      {type !== 'transfer' && (
        <fieldset>
          <legend className="text-sm font-medium mb-2">Categoría</legend>
          <div className="grid grid-cols-4 gap-2">
            {catList.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)} aria-pressed={categoryId === c.id}
                className={cn('flex flex-col items-center gap-1.5 rounded-2xl border p-2 min-h-[76px] transition',
                  categoryId === c.id ? 'border-primary bg-lavender' : 'border-line hover:bg-ink/[0.03]')}>
                <IconBadge icon={c.icon} color={c.color} size={34} />
                <span className="text-[11px] font-medium leading-tight text-center break-words w-full">{c.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {type === 'transfer' ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="Desde">
            <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {options.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <ArrowRight className="mb-3.5 text-muted" size={20} aria-hidden />
          <Field label="Hacia">
            <select className={inputCls} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Elegir…</option>
              {options.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
      ) : (
        <Field label="Cuenta">
          <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {options.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Descripción"><input className={inputCls} value={description} maxLength={120} placeholder={type === 'transfer' ? 'Transferencia' : 'Ej: Almuerzo'} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Fecha"><input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value || todayStr())} /></Field>
      </div>
      <Field label="Notas (opcional)"><input className={inputCls} value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} /></Field>

      <div className="flex gap-3 pt-1">
        {editing && <Button variant="danger" onClick={remove} aria-label="Eliminar movimiento"><Trash2 size={18} /></Button>}
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}
