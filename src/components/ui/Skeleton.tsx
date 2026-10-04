import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-ink/[0.07]', className)} />
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando">
      <Skeleton className="h-40 rounded-card" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}
      </div>
      <Skeleton className="h-64 rounded-card" />
    </div>
  )
}
