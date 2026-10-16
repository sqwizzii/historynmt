import { useEffect, useRef, useState } from 'react'

function canUseIntersectionObserver() {
  return typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined'
}

/** Wait two frames so the browser paints the hidden state before revealing. */
function afterPaint(fn) {
  let id2 = 0
  const id1 = requestAnimationFrame(() => {
    id2 = requestAnimationFrame(fn)
  })
  return () => {
    cancelAnimationFrame(id1)
    cancelAnimationFrame(id2)
  }
}

/**
 * Observe element visibility. Content stays visible when:
 * - motion is disabled,
 * - IntersectionObserver is unavailable,
 * - or the safety timeout fires (avoids permanently hidden UI).
 */
export function useInView({
  root = null,
  rootMargin = '0px 0px -6% 0px',
  threshold = 0.05,
  once = true,
  disabled = false,
  fallbackMs = 1400,
} = {}) {
  const ref = useRef(null)
  const [observed, setObserved] = useState(false)
  const observe = !disabled && canUseIntersectionObserver()
  const inView = disabled || !observe || observed

  useEffect(() => {
    if (!observe) return undefined

    const node = ref.current
    if (!node) {
      const timer = window.setTimeout(() => setObserved(true), fallbackMs)
      return () => window.clearTimeout(timer)
    }

    let settled = false
    let cancelPaint = () => {}
    const reveal = () => {
      if (settled) return
      settled = true
      cancelPaint = afterPaint(() => setObserved(true))
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          if (once) observer.disconnect()
          return
        }
        if (!once) {
          settled = false
          setObserved(false)
        }
      },
      { root, rootMargin, threshold },
    )

    observer.observe(node)
    const timer = window.setTimeout(reveal, fallbackMs)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      cancelPaint()
    }
  }, [root, rootMargin, threshold, once, observe, fallbackMs])

  return [ref, inView]
}
