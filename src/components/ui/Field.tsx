import type { ReactNode } from 'react'

export const inputCls =
  'w-full min-h-12 rounded-2xl border border-line bg-surface px-4 text-[16px] text-ink placeholder:text-muted/70 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  )
}
