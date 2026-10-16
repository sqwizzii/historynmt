import { useCallback, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

export default function Tilt({ children, className = '', max = 6, ...props }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef(null)

  const onMove = useCallback(
    (event) => {
      if (reduced || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const rotateY = (x - 0.5) * max * 2
      const rotateX = (0.5 - y) * max * 2
      ref.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
    },
    [max, reduced],
  )

  const onLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = ''
  }, [])

  return (
    <div
      ref={ref}
      className={`motion-tilt ${className}`.trim()}
      onMouseMove={reduced ? undefined : onMove}
      onMouseLeave={reduced ? undefined : onLeave}
      {...props}
    >
      {children}
    </div>
  )
}
