import { Children, cloneElement, isValidElement } from 'react'
import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

/**
 * Stagger children with keyframe animations (not transitions) so entrance
 * always plays after the hidden frame is painted.
 */
export default function Stagger({
  as: Tag = 'div',
  children,
  className = '',
  step = 80,
  baseDelay = 0,
  once = true,
  immediate = false,
  ...props
}) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView({ once, disabled: reduced || immediate })
  const visible = immediate || inView || reduced

  return (
    <Tag ref={ref} className={`motion-stagger ${visible ? 'is-visible' : ''} ${className}`.trim()} {...props}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child
        const delay = baseDelay + index * step
        const prevStyle = child.props.style ?? {}
        return cloneElement(child, {
          className: `motion-stagger-item ${child.props.className ?? ''}`.trim(),
          style: { ...prevStyle, '--motion-delay': `${delay}ms` },
        })
      })}
    </Tag>
  )
}
