import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { TransactionModal } from '../components/transactions/TransactionForm'
import type { Transaction } from '../types'

type ToastKind = 'success' | 'error'
interface ToastItem { id: number; message: string; kind: ToastKind }
interface ConfirmOptions { title: string; message: string; confirmLabel?: string }

interface UIValue {
  toast: (message: string, kind?: ToastKind) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
  openTx: (editing?: Transaction) => void
}

const UIContext = createContext<UIValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)
  const [txModal, setTxModal] = useState<{ open: boolean; editing: Transaction | null }>({ open: false, editing: null })
  const nextId = useRef(1)

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options)
    return new Promise<boolean>((resolve) => { resolver.current = resolve })
  }, [])

  const answer = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setConfirmState(null)
  }

  const openTx = useCallback((editing?: Transaction) => setTxModal({ open: true, editing: editing ?? null }), [])
  const value = useMemo(() => ({ toast, confirm, openTx }), [toast, confirm, openTx])

  return (
    <UIContext.Provider value={value}>
      {children}

      <TransactionModal open={txModal.open} editing={txModal.editing} onClose={() => setTxModal({ open: false, editing: null })} />

      <Modal open={!!confirmState} onClose={() => answer(false)} title={confirmState?.title ?? ''}>
        <p className="text-muted mb-5">{confirmState?.message}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="soft" onClick={() => answer(false)}>Cancelar</Button>
          <Button variant="danger" onClick={() => answer(true)}>{confirmState?.confirmLabel ?? 'Eliminar'}</Button>
        </div>
      </Modal>

      <div aria-live="polite" className="fixed z-[60] left-0 right-0 top-[max(1rem,env(safe-area-inset-top))] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="animate-sheet pointer-events-auto flex items-center gap-2 rounded-2xl bg-ink text-white px-4 py-3 text-sm font-medium shadow-lg max-w-sm">
            {t.kind === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <XCircle size={18} className="text-red-400 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  )
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI debe usarse dentro de UIProvider')
  return ctx
}

