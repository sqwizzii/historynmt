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

export default function CountUp({ value, className = '', duration = 700 }) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView({ once: true, disabled: reduced })
  const parsed = useMemo(() => parseNumeric(value), [value])
  const [display, setDisplay] = useState(() => (parsed && !reduced ? `0${parsed.suffix}` : value))

  useEffect(() => {
    if (!parsed || reduced || !inView) {
      setDisplay(value)
      return undefined
    }

    const start = performance.now()
    const to = parsed.num
    let frame = 0

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      const current = Math.round(to * eased)
      setDisplay(`${current}${parsed.suffix}`)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, parsed, reduced, inView, duration])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
