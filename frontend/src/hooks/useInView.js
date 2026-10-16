import { useEffect, useRef, useState } from 'react'

export function useInView({
  root = null,
  rootMargin = '0px 0px -8% 0px',
  threshold = 0.12,
  once = true,
  disabled = false,
} = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(disabled)

  useEffect(() => {
    if (disabled) {
      setInView(true)
      return undefined
    }
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { root, rootMargin, threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [root, rootMargin, threshold, once, disabled])

  return [ref, inView]
}
