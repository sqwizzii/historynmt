import { useLocation } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

/**
 * Remounts children on route change so entrance animations always play.
 * Keep duration short so navigation never feels sluggish.
 */
export default function PageEnter({ children, className = '' }) {
  const { pathname } = useLocation()
  const reduced = usePrefersReducedMotion()

  return (
    <div key={pathname} className={`${reduced ? '' : 'page-enter'} ${className}`.trim()}>
      {children}
    </div>
  )
}
