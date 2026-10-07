import { useState } from 'react'
import { CheckCircle2, Download, Share, SquarePlus, X } from 'lucide-react'
import { Button } from './Button'
import { Card, SectionTitle } from './Card'
import { Logo } from './Logo'
import { usePwaInstall } from '../../utils/pwa'

const BANNER_KEY = 'monera-install-banner-hidden'

function IOSSteps() {
  return (
    <ol className="space-y-2 text-sm">
      <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-lavender text-primary-ink text-xs font-bold grid place-items-center">1</span>
        Abre MonEra en <b>Safari</b> y toca <Share size={16} className="text-primary inline" aria-label="Compartir" /> <b>Compartir</b></li>
      <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-lavender text-primary-ink text-xs font-bold grid place-items-center">2</span>
        Elige <SquarePlus size={16} className="text-primary inline" aria-hidden /> <b>Añadir a pantalla de inicio</b></li>
      <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-lavender text-primary-ink text-xs font-bold grid place-items-center">3</span>
        Toca <b>Añadir</b>. ¡Listo!</li>
    </ol>
  )
}

/** Configuración: estado de la instalación y cómo instalar en cada dispositivo. */
export function InstallCard() {
  const { installed, canPrompt, needsIOSSteps, install } = usePwaInstall()
  return (
    <Card>
      <SectionTitle title="App en tu dispositivo" />
      {installed ? (
        <p className="flex items-center gap-2 text-sm text-success font-medium"><CheckCircle2 size={18} />MonEra está instalada en este dispositivo.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">Instálala para abrirla desde su ícono, en pantalla completa y aunque no tengas internet.</p>
          {canPrompt ? <Button onClick={install}><Download size={18} />Instalar MonEra</Button>
            : needsIOSSteps ? <IOSSteps />
            : <p className="text-sm">Abre MonEra en <b>Chrome</b> o <b>Edge</b> y usa la opción <b>Instalar app</b> del menú (⋮) o el ícono de instalar en la barra de direcciones.</p>}
        </div>
      )}
    </Card>
  )
}

/** Inicio: invitación a instalar (solo si se puede y no la has cerrado). */
export function InstallBanner() {
  const { installed, canPrompt, needsIOSSteps, install } = usePwaInstall()
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(BANNER_KEY) === '1' } catch { return false } })
  const [showSteps, setShowSteps] = useState(false)
  if (installed || hidden || !(canPrompt || needsIOSSteps)) return null

  const close = () => { setHidden(true); try { localStorage.setItem(BANNER_KEY, '1') } catch { /* sin almacenamiento */ } }

  return (
    <Card className="!p-4 flex flex-col gap-3 border-primary/30 bg-lavender/60">
      <div className="flex items-center gap-3">
        <Logo size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Instala MonEra</p>
          <p className="text-xs text-muted">Ábrela desde su ícono, en pantalla completa y sin internet.</p>
        </div>
        {canPrompt
          ? <Button onClick={install} className="!min-h-10 shrink-0">Instalar</Button>
          : <Button variant="soft" onClick={() => setShowSteps((v) => !v)} className="!min-h-10 shrink-0 bg-surface">{showSteps ? 'Ocultar' : 'Cómo'}</Button>}
        <button onClick={close} aria-label="No mostrar de nuevo" className="size-9 grid place-items-center rounded-full text-muted hover:bg-ink/5 shrink-0"><X size={18} /></button>
      </div>
      {showSteps && <IOSSteps />}
    </Card>
  )
}
