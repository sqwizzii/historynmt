import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  variant = 'up',
  delay = 0,
  once = true,
  immediate = false,
  ...props
}) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView({ once, disabled: reduced || immediate })
  const visible = immediate || inView || reduced

  return (
    <Tag
      ref={ref}
      className={`motion-reveal motion-reveal--${variant}${visible ? ' is-visible' : ''} ${className}`.trim()}
      style={delay ? { '--motion-delay': `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  )
}
