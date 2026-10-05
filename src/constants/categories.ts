import type { AccountType, Category } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'exp-food', name: 'Alimentación', type: 'expense', icon: 'utensils', color: '#f59e0b', isDefault: true },
  { id: 'exp-transport', name: 'Transporte', type: 'expense', icon: 'car', color: '#3b82f6', isDefault: true },
  { id: 'exp-home', name: 'Hogar', type: 'expense', icon: 'home', color: '#8b5cf6', isDefault: true },
  { id: 'exp-utilities', name: 'Servicios', type: 'expense', icon: 'zap', color: '#eab308', isDefault: true },
  { id: 'exp-shopping', name: 'Compras', type: 'expense', icon: 'shopping-bag', color: '#ec4899', isDefault: true },
  { id: 'exp-fun', name: 'Entretenimiento', type: 'expense', icon: 'film', color: '#f97316', isDefault: true },
  { id: 'exp-health', name: 'Salud', type: 'expense', icon: 'heart-pulse', color: '#ef4444', isDefault: true },
  { id: 'exp-edu', name: 'Educación', type: 'expense', icon: 'graduation-cap', color: '#06b6d4', isDefault: true },
  { id: 'exp-subs', name: 'Suscripciones', type: 'expense', icon: 'repeat', color: '#6366f1', isDefault: true },
  { id: 'exp-tech', name: 'Tecnología', type: 'expense', icon: 'laptop', color: '#64748b', isDefault: true },
  { id: 'exp-travel', name: 'Viajes', type: 'expense', icon: 'plane', color: '#14b8a6', isDefault: true },
  { id: 'exp-other', name: 'Otros', type: 'expense', icon: 'ellipsis', color: '#94a3b8', isDefault: true },
  { id: 'inc-salary', name: 'Salario', type: 'income', icon: 'wallet', color: '#16a34a', isDefault: true },
  { id: 'inc-freelance', name: 'Freelance', type: 'income', icon: 'laptop', color: '#0ea5e9', isDefault: true },
  { id: 'inc-business', name: 'Negocio', type: 'income', icon: 'store', color: '#f59e0b', isDefault: true },
  { id: 'inc-gift', name: 'Regalo', type: 'income', icon: 'gift', color: '#ec4899', isDefault: true },
  { id: 'inc-sale', name: 'Venta', type: 'income', icon: 'tag', color: '#8b5cf6', isDefault: true },
  { id: 'inc-other', name: 'Otros', type: 'income', icon: 'ellipsis', color: '#94a3b8', isDefault: true },
]

export const COLOR_OPTIONS = [
  '#6c4cf1', '#3b82f6', '#06b6d4', '#14b8a6', '#16a34a', '#eab308',
  '#f97316', '#ef4444', '#ec4899', '#64748b',
]

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Cuenta bancaria' },
  { value: 'digital_wallet', label: 'Billetera digital' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'other', label: 'Otro' },
]

/** Icono sugerido para cada tipo de cuenta (se aplica al cambiar el tipo si no elegiste otro) */
export const ACCOUNT_TYPE_ICON: Record<AccountType, string> = {
  bank: 'landmark', digital_wallet: 'smartphone', cash: 'banknote', credit_card: 'credit-card', savings: 'piggy-bank', other: 'wallet',
}
