import { useState } from 'react'
import { LogOut, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { IconBadge } from '../components/ui/IconBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { CategoryModal } from '../components/accounts/CategoryForm'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { removeItem } from '../services/db'

export default function Settings() {
  const { user, logout } = useAuth()
  const { categories, transactions, budgets } = useData()
  const { toast, confirm } = useUI()
  const [creating, setCreating] = useState(false)

  async function removeCategory(id: string, name: string) {
    if (!user) return
    if (transactions.some((t) => t.categoryId === id) || budgets.some((b) => b.categoryId === id)) {
      return toast('Esta categoría está en uso; no se puede eliminar.', 'error')
    }
    if (!(await confirm({ title: 'Eliminar categoría', message: `¿Eliminar "${name}"?` }))) return
    try { await removeItem(user.uid, 'categories', id); toast('Categoría eliminada') }
    catch { toast('No pudimos eliminarla.', 'error') }
  }

  const groups = [
    { title: 'Categorías de gasto', items: categories.filter((c) => c.type === 'expense') },
    { title: 'Categorías de ingreso', items: categories.filter((c) => c.type === 'income') },
  ]

  return (
    <>
      <PageHeader title="Configuración" />
      <div className="space-y-5 max-w-2xl">
        <Card>
          <SectionTitle title="Tu perfil" />
          <p className="font-semibold">{user?.displayName ?? 'Sin nombre'}</p>
          <p className="text-sm text-muted">{user?.email}</p>
          <p className="text-xs text-muted mt-2">Moneda: peso colombiano (COP) · Zona horaria: Bogotá</p>
        </Card>

        {groups.map((g) => (
          <Card key={g.title}>
            <SectionTitle title={g.title} action={g.title.includes('gasto') ? <Button variant="soft" onClick={() => setCreating(true)} className="!min-h-10"><Plus size={16} />Nueva</Button> : undefined} />
            <ul className="divide-y divide-line">
              {g.items.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <IconBadge icon={c.icon} color={c.color} size={36} />
                  <span className="flex-1">{c.name}</span>
                  {c.isDefault ? <span className="text-xs text-muted">Predeterminada</span> : (
                    <button aria-label={`Eliminar ${c.name}`} onClick={() => removeCategory(c.id, c.name)} className="size-10 grid place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Button variant="danger" full onClick={logout}><LogOut size={18} />Cerrar sesión</Button>
      </div>
      {creating && <CategoryModal onClose={() => setCreating(false)} />}
    </>
  )
}
