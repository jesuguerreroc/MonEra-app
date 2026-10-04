import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import { seedCategories, type CollectionName } from '../services/db'
import { accountBalance } from '../utils/finance'
import type { Account, Budget, Category, Goal, Loan, Transaction } from '../types'

interface DataValue {
  loading: boolean
  error: string | null
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  debts: Loan[]
  receivables: Loan[]
  budgets: Budget[]
  goals: Goal[]
  balances: Record<string, number>
  totalBalance: number
  categoryById: (id?: string) => Category | undefined
  accountById: (id?: string) => Account | undefined
}

const DataContext = createContext<DataValue | null>(null)
const NAMES: CollectionName[] = ['accounts', 'categories', 'transactions', 'debts', 'receivables', 'budgets', 'goals']

type Store = {
  accounts: Account[]; categories: Category[]; transactions: Transaction[]
  debts: Loan[]; receivables: Loan[]; budgets: Budget[]; goals: Goal[]
}
const EMPTY: Store = { accounts: [], categories: [], transactions: [], debts: [], receivables: [], budgets: [], goals: [] }

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [store, setStore] = useState<Store>(EMPTY)
  const [loadedCount, setLoadedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return
    const loaded = new Set<string>()
    const unsubs = NAMES.map((name) =>
      onSnapshot(
        collection(db, 'users', uid, name),
        (snap) => {
          const items = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
          setStore((s) => ({ ...s, [name]: items }) as Store)
          loaded.add(name)
          setLoadedCount(loaded.size)
          // Primera vez: crear categorías predeterminadas
          if (name === 'categories' && snap.empty && !snap.metadata.fromCache) {
            seedCategories(uid).catch(() => setError('No pudimos crear tus categorías.'))
          }
        },
        () => setError('No pudimos cargar tus datos. Revisa tu conexión.'),
      ),
    )
    return () => {
      unsubs.forEach((u) => u())
      setStore(EMPTY)
      setLoadedCount(0)
    }
  }, [uid])

  const value = useMemo<DataValue>(() => {
    const transactions = [...store.transactions].sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
    )
    const accounts = [...store.accounts].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    const balances: Record<string, number> = {}
    for (const a of accounts) balances[a.id] = accountBalance(a, transactions)
    const totalBalance = accounts.filter((a) => a.active).reduce((s, a) => s + balances[a.id], 0)
    const cats = new Map(store.categories.map((c) => [c.id, c]))
    const accs = new Map(accounts.map((a) => [a.id, a]))
    return {
      ...store,
      transactions,
      accounts,
      loading: !!uid && loadedCount < NAMES.length,
      error,
      balances,
      totalBalance,
      categoryById: (id) => (id ? cats.get(id) : undefined),
      accountById: (id) => (id ? accs.get(id) : undefined),
    }
  }, [store, loadedCount, error, uid])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
