import { useNavigate } from 'react-router-dom'
import { Bell, RotateCcw } from 'lucide-react'
import { Card, SectionTitle } from '../ui/Card'
import { AlertItem, useAlerts } from '../../context/AlertsContext'
import { ALERT_KIND_LABEL, type AlertKind } from '../../utils/alerts'
import { cn } from '../../utils/cn'

/** Campana con el número de alertas pendientes */
export function AlertsBell({ withLabel, className }: { withLabel?: boolean; className?: string }) {
  const { alerts, openPanel } = useAlerts()
  const urgent = alerts.some((a) => a.level !== 'info')
  return (
    <button onClick={openPanel} title="Alertas" aria-label={`Alertas${alerts.length ? ` (${alerts.length})` : ''}`}
      className={cn('relative flex items-center gap-3 rounded-full text-muted hover:bg-ink/5 hover:text-ink transition', className)}>
      <span className="relative grid place-items-center">
        <Bell size={20} />
        {alerts.length > 0 && (
          <span className={cn('absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white grid place-items-center',
            urgent ? 'bg-danger' : 'bg-primary')}>{alerts.length > 9 ? '9+' : alerts.length}</span>
        )}
      </span>
      {withLabel && <span className="hidden lg:inline">Alertas</span>}
    </button>
  )
}

/** Inicio: las 2 alertas más importantes */
export function AlertsSummary() {
  const { alerts, dismiss, openPanel } = useAlerts()
  const navigate = useNavigate()
  if (alerts.length === 0) return null
  return (
    <section aria-label="Alertas" className="space-y-2">
      <ul className="space-y-2">
        {alerts.slice(0, 2).map((a) => <AlertItem key={a.id} compact alert={a} onOpen={() => navigate(a.to)} onDismiss={() => dismiss(a.id)} />)}
      </ul>
      {alerts.length > 2 && (
        <button onClick={openPanel} className="text-sm font-medium text-primary-ink min-h-9 px-1">Ver todas las alertas ({alerts.length})</button>
      )}
    </section>
  )
}

/** Configuración: qué alertas mostrar y desde qué % del presupuesto avisar */
export function AlertsSettings() {
  const { prefs, setPrefs, dismissedCount, restoreDismissed } = useAlerts()
  const toggle = (k: AlertKind) => setPrefs({ ...prefs, enabled: { ...prefs.enabled, [k]: !prefs.enabled[k] } })
  return (
    <Card>
      <SectionTitle title="Alertas" />
      <ul className="divide-y divide-line">
        {(Object.keys(ALERT_KIND_LABEL) as AlertKind[]).map((k) => (
          <li key={k}>
            <label className="flex items-center gap-3 py-2.5 min-h-12 cursor-pointer">
              <span className="flex-1">
                <span className="block text-sm font-medium">{ALERT_KIND_LABEL[k].label}</span>
                <span className="block text-xs text-muted">{ALERT_KIND_LABEL[k].hint}</span>
              </span>
              <input type="checkbox" className="size-5 accent-[#6c4cf1]" checked={prefs.enabled[k]} onChange={() => toggle(k)} />
            </label>
            {k === 'budget' && prefs.enabled.budget && (
              <div className="flex items-center gap-2 pb-3 text-sm">
                <span className="text-muted">Avisar al</span>
                {[70, 80, 90].map((p) => (
                  <button key={p} onClick={() => setPrefs({ ...prefs, budgetThreshold: p })} aria-pressed={prefs.budgetThreshold === p}
                    className={cn('min-h-9 px-3 rounded-full border text-sm font-medium transition',
                      prefs.budgetThreshold === p ? 'bg-primary text-white border-primary' : 'border-line text-muted')}>{p}%</button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {dismissedCount > 0 && (
        <button onClick={restoreDismissed} className="mt-3 flex items-center gap-2 text-sm font-medium text-primary-ink min-h-11">
          <RotateCcw size={16} />Volver a mostrar las alertas que marqué como "Entendido"
        </button>
      )}
      <p className="text-xs text-muted mt-2">Estas preferencias se guardan en este dispositivo.</p>
    </Card>
  )
}
