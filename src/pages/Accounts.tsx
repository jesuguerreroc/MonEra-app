import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { IconBadge } from '../components/ui/IconBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { AccountModal } from '../components/accounts/AccountForm'
import { ACCOUNT_TYPES } from '../constants/categories'
import { useData } from '../context/DataContext'
import { formatCOP } from '../utils/format'
import type { Account } from '../types'

export default function Accounts() {
  const { accounts, balances, totalBalance, loading } = useData()
  const [modal, setModal] = useState<{ open: boolean; editing: Account | null }>({ open: false, editing: null })
  const open = (editing: Account | null = null) => setModal({ open: true, editing })

  return (
    <>
      <PageHeader title="Cuentas" subtitle={accounts.length ? `Saldo total ${formatCOP(totalBalance)}` : 'Dónde guardas tu dinero'}
        action={<Button onClick={() => open()}><Plus size={18} />Nueva</Button>} />
      {loading ? <Skeleton className="h-40 rounded-card" /> : accounts.length === 0 ? (
        <Card>
          <EmptyState icon={Wallet} title="Aún no tienes cuentas" text="Crea tu primera cuenta (Bancolombia, Nequi, Efectivo…) para empezar a registrar movimientos."
            actionLabel="Crear cuenta" onAction={() => open()} />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <button key={a.id} onClick={() => open(a)} className="text-left">
              <Card className={`flex items-center gap-4 hover:border-secondary transition ${a.active ? '' : 'opacity-60'}`}>
                <IconBadge icon={a.icon} color={a.color} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{a.name}</p>
                  <p className="text-xs text-muted">{ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}{a.active ? '' : ' · Inactiva'}</p>
                </div>
                <p className={`font-bold tabular-nums ${balances[a.id] < 0 ? 'text-danger' : ''}`}>{formatCOP(balances[a.id] ?? 0)}</p>
              </Card>
            </button>
          ))}
        </div>
      )}
      {modal.open && <AccountModal open editing={modal.editing} onClose={() => setModal({ open: false, editing: null })} />}
    </>
  )
}
