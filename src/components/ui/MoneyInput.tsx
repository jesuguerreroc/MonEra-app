import { groupDigits, parseAmount } from '../../utils/format'
import { cn } from '../../utils/cn'
import { inputCls } from './Field'

interface Props { value: number; onChange: (v: number) => void; autoFocus?: boolean; big?: boolean }

/** Campo de monto: muestra 35.000 mientras escribes y guarda un entero. */
export function MoneyInput({ value, onChange, autoFocus, big }: Props) {
  return (
    <div className="relative">
      <span className={cn('absolute left-4 top-1/2 -translate-y-1/2 text-muted font-semibold', big && 'text-2xl')}>$</span>
      <input
        inputMode="numeric" autoFocus={autoFocus} placeholder="0" aria-label="Monto"
        value={value ? groupDigits(value) : ''}
        onChange={(e) => onChange(parseAmount(e.target.value))}
        className={cn(inputCls, 'pl-8', big && 'text-3xl font-bold min-h-16 pl-10')}
      />
    </div>
  )
}
