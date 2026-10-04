import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface Props { icon: LucideIcon; title: string; text: string; actionLabel?: string; onAction?: () => void }

export function EmptyState({ icon: Icon, title, text, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6 animate-rise">
      <div className="size-16 rounded-full bg-lavender text-primary grid place-items-center mb-4">
        <Icon size={28} />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted text-sm mt-1 max-w-xs">{text}</p>
      {actionLabel && onAction && <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
