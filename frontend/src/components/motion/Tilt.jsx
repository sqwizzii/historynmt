import { useCallback, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

export default function Tilt({ children, className = '', max = 8, ...props }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef(null)
  const raf = useRef(0)

  const onMove = useCallback(
    (event) => {
      if (reduced || !ref.current) return
      const node = ref.current
      const rect = node.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const rotateY = (x - 0.5) * max * 2
      const rotateX = (0.5 - y) * max * 2

      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        node.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.01)`
      })
    },
    [max, reduced],
  )

  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current)
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
