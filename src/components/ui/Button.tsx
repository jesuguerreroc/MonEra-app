import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'soft' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_8px_20px_-10px_rgba(108,76,241,.9)]',
  soft: 'bg-lavender text-primary-ink hover:bg-secondary/25',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  loading?: boolean
}

export function Button({ variant = 'primary', full, loading, className, children, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 min-h-12 text-[15px] font-semibold transition duration-150 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none',
        styles[variant], full && 'w-full', className,
      )}
    >
      {loading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  )
}
