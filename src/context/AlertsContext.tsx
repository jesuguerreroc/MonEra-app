import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, BellOff, Lightbulb, Settings2 } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useData } from './DataContext'
import { computeAlerts, DEFAULT_ALERT_PREFS, type AlertLevel, type AlertPrefs, type AppAlert } from '../utils/alerts'
import { todayStr } from '../utils/format'
import { cn } from '../utils/cn'

// Se guardan en este dispositivo (no en Firebase): qué alertas ocultaste y cómo las configuraste
const DISMISSED_KEY = 'monera-alerts-dismissed'
const PREFS_KEY = 'monera-alert-prefs'

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? { ...fallback, ...JSON.parse(v) } as T : fallback } catch { return fallback }
}
function loadList(key: string): string[] {
  try { const v = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* sin almacenamiento */ }
}

interface AlertsValue {
  alerts: AppAlert[]
  dismiss: (id: string) => void
  restoreDismissed: () => void
  dismissedCount: number
  prefs: AlertPrefs
  setPrefs: (p: AlertPrefs) => void
  openPanel: () => void
}

const AlertsContext = createContext<AlertsValue | null>(null)

export const LEVEL_STYLE: Record<AlertLevel, { icon: typeof AlertCircle; cls: string }> = {
  danger: { icon: AlertTriangle, cls: 'bg-danger/10 text-danger' },
  warning: { icon: AlertCircle, cls: 'bg-warning/10 text-warning' },
  info: { icon: Lightbulb, cls: 'bg-lavender text-primary' },
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const data = useData()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState<string[]>(() => loadList(DISMISSED_KEY))
  const [prefs, setPrefsState] = useState<AlertPrefs>(() => {
    const p = load(PREFS_KEY, DEFAULT_ALERT_PREFS)
    return { ...p, enabled: { ...DEFAULT_ALERT_PREFS.enabled, ...p.enabled } }
  })
  const [panel, setPanel] = useState(false)

  const all = useMemo(() => (data.loading ? [] : computeAlerts({ ...data, today: todayStr(), prefs })), [data, prefs])
  const alerts = useMemo(() => all.filter((a) => !dismissed.includes(a.id)), [all, dismissed])

  const dismiss = useCallback((id: string) => setDismissed((d) => {
    const next = [...d.filter((x) => x !== id), id].slice(-300) // guarda solo las últimas 300
    store(DISMISSED_KEY, next)
    return next
  }), [])
  const restoreDismissed = useCallback(() => { setDismissed([]); store(DISMISSED_KEY, []) }, [])
  const setPrefs = useCallback((p: AlertPrefs) => { setPrefsState(p); store(PREFS_KEY, p) }, [])
  const openPanel = useCallback(() => setPanel(true), [])

  const value = useMemo(() => ({ alerts, dismiss, restoreDismissed, dismissedCount: dismissed.length, prefs, setPrefs, openPanel }),
    [alerts, dismiss, restoreDismissed, dismissed.length, prefs, setPrefs, openPanel])

  const go = (to: string) => { setPanel(false); navigate(to) }

  return (
    <AlertsContext.Provider value={value}>
      {children}
      <Modal open={panel} onClose={() => setPanel(false)} title="Alertas">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8">
            <span className="size-14 rounded-full bg-success/10 text-success grid place-items-center mb-3"><BellOff size={24} /></span>
            <p className="font-semibold">Todo en orden</p>
            <p className="text-sm text-muted mt-1">No hay nada que requiera tu atención ahora.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => <AlertItem key={a.id} alert={a} onOpen={() => go(a.to)} onDismiss={() => dismiss(a.id)} />)}
          </ul>
        )}
        <button onClick={() => go('/configuracion')} className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-ink min-h-11">
          <Settings2 size={16} />Configurar alertas
        </button>
      </Modal>
    </AlertsContext.Provider>
  )
}

/** Una alerta: tocarla lleva a donde corresponde; "Entendido" la oculta. */
export function AlertItem({ alert, onOpen, onDismiss, compact }: { alert: AppAlert; onOpen: () => void; onDismiss: () => void; compact?: boolean }) {
  const { icon: Icon, cls } = LEVEL_STYLE[alert.level]
  return (
    <li className={cn('flex items-start gap-3 rounded-2xl border border-line bg-surface', compact ? 'p-3' : 'p-3.5')}>
      <span className={cn('size-9 rounded-full grid place-items-center shrink-0', cls)}><Icon size={18} /></span>
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-semibold">{alert.title}</span>
        <span className="block text-xs text-muted mt-0.5">{alert.text}</span>
      </button>
      <button onClick={onDismiss} className="text-xs font-semibold text-muted hover:text-ink rounded-lg px-2 min-h-9 shrink-0">Entendido</button>
    </li>
  )
}

export function useAlerts(): AlertsValue {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts debe usarse dentro de AlertsProvider')
  return ctx
}
