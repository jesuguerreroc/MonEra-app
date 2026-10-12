import { useEffect, useRef, useState } from 'react'

/** Anima un número desde su valor anterior hasta el nuevo (respeta "reducir movimiento" del sistema). */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(target)
  const from = useRef(0)

  useEffect(() => {
    const start = from.current
    from.current = target
    if (start === target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(start + (target - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
