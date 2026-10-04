import { cn } from '../../utils/cn'

const DOLLAR = 'M0 -9V9M5.5 -4.5C5.5 -8 -5.5 -8 -5.5 -3.5C-5.5 1 5.5 -1 5.5 4C5.5 8.5 -5.5 8.5 -5.5 4.5'

/** Cerdito Fylo: ojos con $ que laten y una moneda que flota (animated). */
export function PigLogo({ size = 40, animated = false, bg = true, className }: { size?: number; animated?: boolean; bg?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Fylo" className={cn(animated && 'pig-animated', className)}>
      {bg && <rect width="100" height="100" rx="24" fill="#6c4cf1" />}
      <ellipse cx="27" cy="28" rx="8" ry="12" transform="rotate(-28 27 28)" fill="#b9a9fb" />
      <ellipse cx="73" cy="28" rx="8" ry="12" transform="rotate(28 73 28)" fill="#b9a9fb" />
      <circle cx="50" cy="52" r="30" fill="#fff" />
      <ellipse cx="50" cy="62" rx="14" ry="10" fill="#ddd6fe" />
      <ellipse cx="45" cy="62" rx="2.4" ry="3.4" fill="#4930b8" />
      <ellipse cx="55" cy="62" rx="2.4" ry="3.4" fill="#4930b8" />
      {[37, 63].map((cx) => (
        <g key={cx} className="pig-eye">
          <circle cx={cx} cy="44" r="9" fill="#4930b8" />
          <path transform={`translate(${cx} 44) scale(.7)`} d={DOLLAR} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <g className="pig-coin">
        <circle cx="77" cy="78" r="12" fill="#f6c445" />
        <circle cx="77" cy="78" r="8.5" fill="none" stroke="#d99a0b" strokeWidth="1.6" />
        <path d="M77 73V83" stroke="#d99a0b" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="66" cy="82" r="6" fill="#ddd6fe" />
    </svg>
  )
}
