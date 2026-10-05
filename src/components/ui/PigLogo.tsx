import { useId } from 'react'
import { cn } from '../../utils/cn'

/** Alcancía MonEra: cerdito de perfil con una moneda que cae en la ranura (animated). */
export function PigLogo({ size = 40, animated = false, bg = true, className }: { size?: number; animated?: boolean; bg?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  const url = (name: string) => `url(#${id}-${name})`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="MonEra" className={cn('shrink-0', animated && 'pig-animated', className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6ff7" />
          <stop offset="1" stopColor="#4930b8" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx=".25" cy=".15" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-coin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#f2a91c" />
        </linearGradient>
        <clipPath id={`${id}-slot`}><rect width="100" height="40" /></clipPath>
      </defs>
      {bg && <rect width="100" height="100" rx="26" fill={url('bg')} />}
      {bg && <rect width="100" height="100" rx="26" fill={url('glow')} />}
      <g transform="translate(50 52) scale(1.1) translate(-48 -51)">
        <g clipPath={url('slot')}>
          <g className="pig-coin">
            <circle cx="45" cy="27" r="9" fill={url('coin')} />
            <circle cx="45" cy="27" r="6" fill="none" stroke="#c98a0a" strokeWidth="1.6" opacity=".7" />
            <path d="M45 23.5v7" stroke="#c98a0a" strokeWidth="2" strokeLinecap="round" opacity=".8" />
          </g>
        </g>
        <g className="pig-body">
          <rect x="31" y="70" width="9" height="12" rx="4" fill="#ddd6fe" />
          <rect x="55" y="70" width="9" height="12" rx="4" fill="#ddd6fe" />
          <path d="M22.5 56c-5 .5-7.5-3-5.5-6s5.5-1 4 2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="47" cy="59" rx="27" ry="21" fill="#fff" />
          <path d="M56 42.5c0-7 3.5-11.5 7-11.5s5 5 3 12z" fill="#fff" />
          <path d="M59 41c.3-4 2.2-6.5 4-6.5s2.5 3 1.5 6.8z" fill="#ddd6fe" />
          <rect x="69" y="52" width="12" height="14" rx="5.5" fill="#ede9fe" />
          <ellipse cx="73.5" cy="59" rx="1.4" ry="2.2" fill="#6c4cf1" />
          <ellipse cx="77.5" cy="59" rx="1.4" ry="2.2" fill="#6c4cf1" />
          <path d="M58.5 51.5q3-3.5 6 0" fill="none" stroke="#2e2170" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="63" cy="59.5" r="3.4" fill="#c4b5fd" opacity=".7" />
          <rect x="37.5" y="39" width="15" height="3.4" rx="1.7" fill="#4930b8" />
          <path d="M29 51q4-7 11-9" fill="none" stroke="#ede9fe" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
