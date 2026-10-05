import { useId } from 'react'
import { cn } from '../../utils/cn'

// Cada trazo de la "m" es una ola; el segundo es el mismo desplazado a la derecha
const WAVE = 'M23.7 58.8C26.1 58.3 27.9 56.4 29.5 53.3L36.1 41.7C38.8 37.1 42.3 34.3 46.2 34.3C50.5 34.3 53.6 37 54.1 41.3C53 40.2 51.9 39.6 50.7 39.6C49.6 39.6 48.7 40.3 47.6 42.1L39.6 55.8C37.4 59.9 34.3 62.6 30.7 62.6C27.6 62.6 25.3 61 23.7 58.8Z'
const DROP = 'M72.1 52.8C72.4 54.6 72.6 57 72.6 59C72.6 61.5 70.8 62.8 68.5 62.8C66.1 62.8 64.3 60.9 64.3 58.8C64.3 56.6 65.6 55.5 67.4 54.8C69.3 54 70.7 53.7 72.1 52.8Z'

/** Logo MonEra: una "m" hecha de dos olas y una gota (animated: la gota cae de la ola). */
export function Logo({ size = 40, animated = false, className }: { size?: number; animated?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  const url = (name: string) => `url(#${id}-${name})`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="MonEra" className={cn('shrink-0', animated && 'logo-animated', className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7cf4" />
          <stop offset=".55" stopColor="#6f58e6" />
          <stop offset="1" stopColor="#7b67ee" />
        </linearGradient>
        <linearGradient id={`${id}-ink`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#b8a4fb" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill={url('bg')} />
      <g transform="translate(50 50) scale(1.25) translate(-48.15 -48.55)" fill={url('ink')}>
        <path d={WAVE} />
        <path d={WAVE} transform="translate(17.9 0)" />
        <path d={DROP} className="logo-drop" />
      </g>
    </svg>
  )
}
