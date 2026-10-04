import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { removeItem, saveItem } from '../../services/db'
import type { Goal } from '../../types'

export function GoalModal({ editing, onClose }: { editing: Goal | null; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={editing ? 'Editar meta' : 'Nueva meta'}>
      <GoalForm editing={editing} onDone={onClose} />
    </Modal>
  )
}

function GoalForm({ editing, onDone }: { editing: Goal | null; onDone: () => void }) {
  const { user } = useAuth()
  const { toast, confirm } = useUI()
  const [name, setName] = useState(editing?.name ?? '')
  const [target, setTarget] = useState(editing?.target ?? 0)
  const [targetDate, setTargetDate] = useState(editing?.targetDate ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!name.trim()) return toast('Ponle un nombre a tu meta', 'error')
    if (target <= 0) return toast('El objetivo debe ser mayor a $0', 'error')
    setSaving(true)
    try {
      await saveItem(user.uid, 'goals', {
        ...(editing ? { id: editing.id } : {}),
        name: name.trim().slice(0, 60), target,
        ...(targetDate ? { targetDate } : {}),
        contributions: editing?.contributions ?? [],
        createdAt: editing?.createdAt ?? Date.now(),
      })
      toast('Meta guardada'); onDone()
    } catch { toast('No pudimos guardar.', 'error'); setSaving(false) }
  }

  async function remove() {
    if (!user || !editing) return
    if (!(await confirm({ title: 'Eliminar meta', message: 'Se borrará la meta y sus aportes.' }))) return
    try { await removeItem(user.uid, 'goals', editing.id); toast('Meta eliminada'); onDone() }
    catch { toast('No pudimos eliminarla.', 'error') }
  }

  return (
    <div className="space-y-4">
      <Field label="Nombre"><input className={inputCls} value={name} maxLength={60} placeholder="Ej: Casa" onChange={(e) => setName(e.target.value)} autoFocus /></Field>
      <Field label="Monto objetivo"><MoneyInput value={target} onChange={setTarget} /></Field>
      <Field label="Fecha objetivo (opcional)"><input className={inputCls} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
      <div className="flex gap-3">
        {editing && <Button variant="danger" onClick={remove} aria-label="Eliminar meta"><Trash2 size={18} /></Button>}
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}
