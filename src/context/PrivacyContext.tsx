import { createContext, Fragment, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { setHideAmounts } from '../utils/format'
import { cn } from '../utils/cn'

const KEY = 'monera-privacy' // se recuerda en este dispositivo

interface PrivacyValue { hidden: boolean; toggle: () => void }
const PrivacyContext = createContext<PrivacyValue | null>(null)

function readHidden() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

/** Modo privado: oculta todos los montos de la app (útil en lugares públicos). */
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(readHidden)
  // Se aplica antes de que se dibujen los hijos, así ningún monto alcanza a mostrarse
  setHideAmounts(hidden)

  const toggle = useCallback(() => setHidden((h) => {
    try { localStorage.setItem(KEY, h ? '0' : '1') } catch { /* sin almacenamiento */ }
    return !h
  }), [])
  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle])
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

/** Vuelve a dibujar las pantallas al activar/desactivar el modo privado (los montos se formatean al dibujar). */
export function PrivacyBoundary({ children }: { children: ReactNode }) {
  const { hidden } = usePrivacy()
  return <Fragment key={hidden ? 'oculto' : 'visible'}>{children}</Fragment>
}

/** Botón de ojo para mostrar/ocultar montos */
export function PrivacyToggle({ className, size = 20 }: { className?: string; size?: number }) {
  const { hidden, toggle } = usePrivacy()
  return (
    <button type="button" onClick={toggle} aria-pressed={hidden}
      aria-label={hidden ? 'Mostrar montos' : 'Ocultar montos'} title={hidden ? 'Mostrar montos' : 'Ocultar montos (modo privado)'}
      className={cn('inline-flex items-center justify-center transition', className)}>
      {hidden ? <EyeOff size={size} /> : <Eye size={size} />}
    </button>
  )
}

export function usePrivacy(): PrivacyValue {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy debe usarse dentro de PrivacyProvider')
  return ctx
}
