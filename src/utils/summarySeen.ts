// Recuerda (en este dispositivo) qué resúmenes mensuales ya abriste o descartaste
const KEY = 'monera-summary-seen'

function read(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}

export const wasSummarySeen = (month: string) => read().includes(month)

export function markSummarySeen(month: string) {
  const list = read()
  if (list.includes(month)) return
  try { localStorage.setItem(KEY, JSON.stringify([...list, month].slice(-24))) } catch { /* sin almacenamiento */ }
}
