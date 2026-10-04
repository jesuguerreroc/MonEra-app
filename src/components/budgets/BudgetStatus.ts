import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react'

export type BudgetState = 'normal' | 'warning' | 'exceeded'

export function budgetState(spent: number, limit: number): BudgetState {
  if (spent > limit) return 'exceeded'
  return limit > 0 && spent / limit >= 0.8 ? 'warning' : 'normal'
}

/** Estado con texto + icono + color (no depende solo del color) */
export const BUDGET_META: Record<BudgetState, { label: string; icon: LucideIcon; text: string; tone: 'success' | 'warning' | 'danger' }> = {
  normal: { label: 'Vas bien', icon: CheckCircle2, text: 'text-success', tone: 'success' },
  warning: { label: 'Cerca del límite', icon: AlertTriangle, text: 'text-warning', tone: 'warning' },
  exceeded: { label: 'Excedido', icon: XCircle, text: 'text-danger', tone: 'danger' },
}
