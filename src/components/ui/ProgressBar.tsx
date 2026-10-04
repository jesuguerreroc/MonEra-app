import { cn } from '../../utils/cn'

type Tone = 'primary' | 'success' | 'warning' | 'danger'
const tones: Record<Tone, string> = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }

export function ProgressBar({ value, tone = 'primary', label }: { value: number; tone?: Tone; label: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}
      className="h-2.5 rounded-full bg-ink/[0.06] overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-500', tones[tone])} style={{ width: `${v}%` }} />
    </div>
  )
}
