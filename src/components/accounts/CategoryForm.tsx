import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/Field'
import { getIcon, CATEGORY_ICON_KEYS } from '../../constants/icons'
import { COLOR_OPTIONS } from '../../constants/categories'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { saveItem } from '../../services/db'
import { cn } from '../../utils/cn'

export function CategoryModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { toast } = useUI()
  const [name, setName] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [icon, setIcon] = useState('tag')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!name.trim()) return toast('Escribe un nombre', 'error')
    setSaving(true)
    try {
      await saveItem(user.uid, 'categories', { name: name.trim().slice(0, 30), type, icon, color })
      toast('Categoría creada'); onClose()
    } catch { toast('No pudimos guardar.', 'error'); setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title="Nueva categoría">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-ink/[0.05]" role="group" aria-label="Tipo">
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} aria-pressed={type === t} onClick={() => setType(t)}
              className={cn('min-h-11 rounded-xl text-sm font-semibold', type === t ? 'bg-surface shadow-card text-ink' : 'text-muted')}>
              {t === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
        <Field label="Nombre"><input className={inputCls} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
        <fieldset>
          <legend className="text-sm font-medium mb-2">Icono</legend>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICON_KEYS.map((k) => {
              const I = getIcon(k)
              return (
                <button key={k} aria-label={k} aria-pressed={icon === k} onClick={() => setIcon(k)}
                  className={cn('size-11 rounded-xl grid place-items-center border', icon === k ? 'border-primary bg-lavender text-primary' : 'border-line text-muted')}>
                  <I size={20} />
                </button>
              )
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium mb-2">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)}
                className={cn('size-9 rounded-full', color === c && 'ring-2 ring-offset-2 ring-ink')} style={{ background: c }} />
            ))}
          </div>
        </fieldset>
        <Button full loading={saving} onClick={save}>Crear categoría</Button>
      </div>
    </Modal>
  )
}
