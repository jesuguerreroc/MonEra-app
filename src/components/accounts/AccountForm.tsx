import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { getIcon } from '../../constants/icons'
import { ACCOUNT_ICON_KEYS } from '../../constants/icons'
import { ACCOUNT_TYPES, COLOR_OPTIONS } from '../../constants/categories'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { removeItem, saveItem } from '../../services/db'
import { cn } from '../../utils/cn'
import type { Account, AccountType } from '../../types'

export function AccountModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Account | null }) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar cuenta' : 'Nueva cuenta'}>
      <AccountForm editing={editing} onDone={onClose} />
    </Modal>
  )
}

function AccountForm({ editing, onDone }: { editing: Account | null; onDone: () => void }) {
  const { user } = useAuth()
  const { transactions } = useData()
  const { toast, confirm } = useUI()
  const [name, setName] = useState(editing?.name ?? '')
  const [type, setType] = useState<AccountType>(editing?.type ?? 'bank')
  const [balance, setBalance] = useState(Math.abs(editing?.initialBalance ?? 0))
  const [color, setColor] = useState(editing?.color ?? COLOR_OPTIONS[0])
  const [icon, setIcon] = useState(editing?.icon ?? 'landmark')
  const [active, setActive] = useState(editing?.active ?? true)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!name.trim()) return toast('Escribe un nombre para la cuenta', 'error')
    setSaving(true)
    try {
      await saveItem(user.uid, 'accounts', {
        ...(editing ? { id: editing.id } : {}),
        name: name.trim().slice(0, 40), type, currency: 'COP', color, icon, active,
        // En tarjeta de crédito el saldo inicial es lo que debes (negativo)
        initialBalance: type === 'credit_card' ? -balance : balance,
      })
      toast(editing ? 'Cuenta actualizada' : 'Cuenta creada')
      onDone()
    } catch { toast('No pudimos guardar la cuenta.', 'error'); setSaving(false) }
  }

  async function remove() {
    if (!user || !editing) return
    if (transactions.some((t) => t.accountId === editing.id || t.toAccountId === editing.id)) {
      return toast('Esta cuenta tiene movimientos. Mejor archívala (desactívala).', 'error')
    }
    if (!(await confirm({ title: 'Eliminar cuenta', message: `¿Eliminar "${editing.name}"?` }))) return
    try { await removeItem(user.uid, 'accounts', editing.id); toast('Cuenta eliminada'); onDone() }
    catch { toast('No pudimos eliminarla.', 'error') }
  }

  return (
    <div className="space-y-4">
      <Field label="Nombre"><input className={inputCls} value={name} maxLength={40} placeholder="Ej: Bancolombia" onChange={(e) => setName(e.target.value)} autoFocus /></Field>
      <Field label="Tipo">
        <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      <Field label={type === 'credit_card' ? 'Lo que debes hoy' : 'Saldo inicial'} hint={type === 'credit_card' ? 'Se cuenta como deuda en tu saldo total.' : 'Lo que tienes en esta cuenta hoy.'}>
        <MoneyInput value={balance} onChange={setBalance} />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Icono y color</legend>
        <div className="flex flex-wrap gap-2 mb-3">
          {ACCOUNT_ICON_KEYS.map((k) => {
            const I = getIcon(k)
            return (
              <button key={k} aria-label={k} aria-pressed={icon === k} onClick={() => setIcon(k)}
                className={cn('size-11 rounded-xl grid place-items-center border', icon === k ? 'border-primary bg-lavender text-primary' : 'border-line text-muted')}>
                <I size={20} />
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button key={c} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)}
              className={cn('size-9 rounded-full ring-offset-2', color === c && 'ring-2 ring-ink')} style={{ background: c }} />
          ))}
        </div>
      </fieldset>

      <label className="flex items-center justify-between min-h-12">
        <span className="text-sm font-medium">Cuenta activa</span>
        <input type="checkbox" className="size-6 accent-[#6c4cf1]" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </label>

      <div className="flex gap-3">
        {editing && <Button variant="danger" onClick={remove} aria-label="Eliminar cuenta"><Trash2 size={18} /></Button>}
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}
