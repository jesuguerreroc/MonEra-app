import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { GoalCard } from '../components/goals/GoalCard'
import { GoalModal } from '../components/goals/GoalForm'
import { PaymentModal } from '../components/debts/PaymentModal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { saveItem } from '../services/db'
import type { Goal } from '../types'

export default function Goals() {
  const { user } = useAuth()
  const { goals, loading } = useData()
  const { toast } = useUI()
  const [form, setForm] = useState<{ editing: Goal | null } | null>(null)
  const [adding, setAdding] = useState<Goal | null>(null)

  async function persist(goal: Goal, contributions: Goal['contributions']) {
    if (!user) return
    await saveItem(user.uid, 'goals', { ...goal, contributions })
  }

  return (
    <>
      <PageHeader title="Metas de ahorro" subtitle="Lo que quieres lograr" action={<Button onClick={() => setForm({ editing: null })}><Plus size={18} />Nueva</Button>} />
      {loading ? <Skeleton className="h-56 rounded-card" /> : goals.length === 0 ? (
        <Card><EmptyState icon={Target} title="Aún no tienes metas" text="Crea una meta (una casa, un viaje, un fondo de emergencia) y registra tus aportes para ver cómo avanzas." actionLabel="Crear meta" onAction={() => setForm({ editing: null })} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onEdit={() => setForm({ editing: g })} onContribute={() => setAdding(g)}
              onDeleteContribution={async (id) => {
                try { await persist(g, g.contributions.filter((c) => c.id !== id)); toast('Aporte eliminado') }
                catch { toast('No pudimos eliminarlo.', 'error') }
              }} />
          ))}
        </div>
      )}
      {form && <GoalModal editing={form.editing} onClose={() => setForm(null)} />}
      {adding && <PaymentModal title="Agregar aporte" onClose={() => setAdding(null)} onSave={(p) => persist(adding, [...adding.contributions, p])} />}
    </>
  )
}
