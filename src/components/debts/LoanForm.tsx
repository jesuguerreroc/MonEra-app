import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { removeItem, saveItem } from '../../services/db'
import { loanPaid } from '../../utils/finance'
import type { Loan } from '../../types'

export interface LoanConfig {
  col: 'debts' | 'receivables'
  title: string
  subtitle: string
  nameLabel: string
  namePlaceholder: string
  newLabel: string
  amountLabel: string
  pendingLabel: string
  payLabel: string
  paidLabel: string
  emptyTitle: string
  emptyText: string
  /** Cuando no queda nada pendiente pero sí hay historial */
  allSettledText: string
  historyEmptyText: string
  /** Aviso al registrar el pago que completa el total */
  settledToast: (name: string) => string
}

export function LoanModal({ cfg, editing, onClose }: { cfg: LoanConfig; editing: Loan | null; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={editing ? 'Editar' : cfg.newLabel}>
      <LoanForm cfg={cfg} editing={editing} onDone={onClose} />
    </Modal>
  )
}

function LoanForm({ cfg, editing, onDone }: { cfg: LoanConfig; editing: Loan | null; onDone: () => void }) {
  const { user } = useAuth()
  const { toast, confirm } = useUI()
  const [name, setName] = useState(editing?.name ?? '')
  const [original, setOriginal] = useState(editing?.original ?? 0)
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!name.trim()) return toast(`Escribe ${cfg.nameLabel.toLowerCase()}`, 'error')
    if (original <= 0) return toast('El monto debe ser mayor a $0', 'error')
    if (editing && original < loanPaid(editing)) return toast('El monto no puede ser menor a lo ya pagado', 'error')
    setSaving(true)
    try {
      await saveItem(user.uid, cfg.col, {
        ...(editing ? { id: editing.id } : {}),
        name: name.trim().slice(0, 60), original,
        ...(dueDate ? { dueDate } : {}),
        ...(notes.trim() ? { notes: notes.trim().slice(0, 300) } : {}),
        payments: editing?.payments ?? [],
        createdAt: editing?.createdAt ?? Date.now(),
      })
      toast('Guardado'); onDone()
    } catch { toast('No pudimos guardar.', 'error'); setSaving(false) }
  }

  async function remove() {
    if (!user || !editing) return
    if (!(await confirm({ title: 'Eliminar', message: 'Se borrará también su historial de pagos.' }))) return
    try { await removeItem(user.uid, cfg.col, editing.id); toast('Eliminado'); onDone() }
    catch { toast('No pudimos eliminarlo.', 'error') }
  }

  return (
    <div className="space-y-4">
      <Field label={cfg.nameLabel}><input className={inputCls} value={name} maxLength={60} placeholder={cfg.namePlaceholder} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
      <Field label={cfg.amountLabel}><MoneyInput value={original} onChange={setOriginal} /></Field>
      <Field label="Fecha límite (opcional)"><input className={inputCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
      <Field label="Notas (opcional)"><input className={inputCls} value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="flex gap-3">
        {editing && <Button variant="danger" onClick={remove} aria-label="Eliminar"><Trash2 size={18} /></Button>}
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  )
}
