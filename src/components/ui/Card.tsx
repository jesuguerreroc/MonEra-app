import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cn('bg-surface/90 rounded-card border border-line/80 shadow-card p-5', className)} />
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  )
}
