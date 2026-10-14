import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { registerOccurrence } from '../../services/recurring'
import { recurringAgenda, recurringTxId } from '../../utils/recurring'
import { formatCOP, todayStr } from '../../utils/format'

/** Registra solos los pagos fijos en modo "automático" que ya tocaron (al abrir la app). No dibuja nada. */
export function RecurringRunner() {
  const { user } = useAuth()
  const { recurring, transactions, loading } = useData()
  const { toast } = useUI()
  const started = useRef(new Set<string>()) // evita repetir mientras Firebase confirma

  useEffect(() => {
    if (!user || loading) return
    const due = recurringAgenda(recurring, new Set(transactions.map((t) => t.id)), todayStr(), 0)
      .filter((i) => i.state === 'due' && i.r.auto && !i.r.variable && i.r.amount > 0)
    for (const { r, date } of due) {
      const key = recurringTxId(r, date)
      if (started.current.has(key)) continue
      started.current.add(key)
      registerOccurrence(user.uid, r, date, r.amount)
        .then(() => toast(`Se registró solo: ${r.name} (${formatCOP(r.amount)})`))
        .catch(() => started.current.delete(key))
    }
  }, [user, loading, recurring, transactions, toast])

  return null
}
