import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { MoneyInput } from '../ui/MoneyInput'
import { useUI } from '../../context/UIContext'
import { formatCOP, todayStr } from '../../utils/format'
import type { Payment } from '../../types'

/** Modal genérico para registrar un pago, abono o aporte */
export function PaymentModal({ title, max, onSave, onClose }: {
  title: string
  /** Límite opcional (por ejemplo, el saldo pendiente) */
  max?: number
  onSave: (p: Payment) => Promise<void>
  onClose: () => void
}) {
  const { toast } = useUI()
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (amount <= 0) return toast('Escribe un monto mayor a $0', 'error')
    if (max !== undefined && amount > max) return toast(`El monto no puede superar ${formatCOP(max)}`, 'error')
    setSaving(true)
    try {
      await onSave({ id: crypto.randomUUID(), amount, date, ...(note.trim() ? { note: note.trim().slice(0, 120) } : {}) })
      toast('Registrado'); onClose()
    } catch { toast('No pudimos guardar.', 'error'); setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="space-y-4">
        <MoneyInput big autoFocus value={amount} onChange={setAmount} />
        {max !== undefined && <button className="text-sm text-primary font-medium min-h-11" onClick={() => setAmount(max)}>Usar el total pendiente ({formatCOP(max)})</button>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha"><input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value || todayStr())} /></Field>
          <Field label="Nota (opcional)"><input className={inputCls} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <Button full loading={saving} onClick={save}>Guardar</Button>
      </div>
    </Modal>
  )
}
