import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] md:text-3xl font-extrabold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
