import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/cn'

/** Botón redondo que alterna entre modo claro y oscuro. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  const dark = resolved === 'dark'
  return (
    <button type="button" onClick={toggle} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'} title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={cn('size-10 grid place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink transition', className)}>
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
