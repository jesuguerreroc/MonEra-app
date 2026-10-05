import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props { open: boolean; onClose: () => void; title: string; children: ReactNode }

/**
 * En móvil sube desde abajo (cómodo con una mano); en escritorio es un diálogo centrado.
 * Se monta en <body> con un portal: si quedara dentro de <main> (que se anima con transform),
 * el `fixed` se mediría contra <main> y el diálogo saldría recortado.
 */
export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className="relative w-full md:max-w-md max-h-[92dvh] overflow-y-auto bg-surface border-line dark:border rounded-t-3xl md:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-sheet shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button aria-label="Cerrar" onClick={onClose} className="size-10 grid place-items-center rounded-full hover:bg-ink/5">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
