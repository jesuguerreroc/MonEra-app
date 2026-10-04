import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { removeItem, saveItem } from '../../services/db'
import type { Budget } from '../../types'

export function BudgetModal({ onClose, editing }: { onClose: () => void; editing: Budget | null }) {
  return (
    <Modal open onClose={onClose} title={editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
      <BudgetForm editing={editing} onDone={onClose} />
    </Modal>
  )
}

function BudgetForm({ editing, onDone }: { editing: Budget | null; onDone: () => void }) {
  const { user } = useAuth()
  const { categories, budgets } = useData()
  const { toast, confirm } = useUI()
  const available = categories.filter((c) => c.type === 'expense' && (c.id === editing?.categoryId || !budgets.some((b) => b.categoryId === c.id)))
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? available[0]?.id ?? '')
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!categoryId) return toast('Elige una categoría', 'error')
    if (amount <= 0) return toast('El presupuesto debe ser mayor a $0', 'error')
    setSaving(true)
    try {
      await saveItem(user.uid, 'budgets', { ...(editing ? { id: editing.id } : {}), categoryId, amount })
      toast('Presupuesto guardado'); onDone()
    } catch { toast('No pudimos guardar.', 'error'); setSaving(false) }
  }

  async function remove() {
    if (!user || !editing) return
    if (!(await confirm({ title: 'Eliminar presupuesto', message: 'Dejarás de vigilar esta categoría.' }))) return
    try { await removeItem(user.uid, 'budgets', editing.id); toast('Presupuesto eliminado'); onDone() }
    catch { toast('No pudimos eliminarlo.', 'error') }
  }

  if (available.length === 0) return <p className="text-muted">Ya tienes presupuesto en todas las categorías de gasto.</p>

  return (
    <div className="space-y-4">
      <Field label="Categoría">
        <select className={inputCls} value={categoryId} disabled={!!editing} onChange={(e) => setCategoryId(e.target.value)}>
          {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Límite mensual" hint="Se repite cada mes."><MoneyInput value={amount} onChange={setAmount} autoFocus /></Field>
      <div className="flex gap-3">
        {editing && <Button variant="danger" onClick={remove} aria-label="Eliminar presupuesto"><Trash2 size={18} /></Button>}
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}
