import { useEffect, useMemo, useState } from 'react'
import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

function parseNumeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return { num: value, suffix: '' }
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^(-?\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return null
  const num = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  return { num, suffix: match[2] ?? '' }
}

export default function CountUp({ value, className = '', duration = 650 }) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView({ once: true, disabled: reduced })
  const parsed = useMemo(() => parseNumeric(value), [value])
  const animate = Boolean(parsed) && !reduced && inView
  const [frame, setFrame] = useState(null)

  useEffect(() => {
    if (!animate || !parsed) return undefined

    let raf = 0
    const start = performance.now()
    const to = parsed.num

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setFrame(`${Math.round(to * eased)}${parsed.suffix}`)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animate, parsed, duration, value])

  const display = animate ? (frame ?? `0${parsed?.suffix ?? ''}`) : value

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
