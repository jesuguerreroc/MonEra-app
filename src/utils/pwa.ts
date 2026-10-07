import { useSyncExternalStore } from 'react'

/** Evento de Chrome/Edge/Android que permite mostrar el diálogo "Instalar app" cuando queramos */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Se llama una vez al arrancar: registra el service worker y escucha el aviso de instalación. */
export function initPwa() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // lo mostramos nosotros con el botón "Instalar"
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; emit() })
}

export function usePwaInstall() {
  const prompt = useSyncExternalStore(subscribe, () => deferred)
  const justInstalled = useSyncExternalStore(subscribe, () => installed)
  const standalone = isStandalone()
  return {
    /** Ya se está usando como app instalada */
    installed: standalone || justInstalled,
    /** Android / Chrome / Edge: se puede abrir el diálogo de instalación con un botón */
    canPrompt: !!prompt && !standalone,
    /** iPhone/iPad en el navegador: hay que instalar a mano desde Compartir */
    needsIOSSteps: isIOS() && !standalone,
    async install() {
      if (!deferred) return
      await deferred.prompt()
      await deferred.userChoice
      deferred = null
      emit()
    },
  }
}

const subscribeOnline = (l: () => void) => {
  window.addEventListener('online', l)
  window.addEventListener('offline', l)
  return () => { window.removeEventListener('online', l); window.removeEventListener('offline', l) }
}

/** true si hay conexión a internet */
export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine)
