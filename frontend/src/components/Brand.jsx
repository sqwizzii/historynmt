import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../config/brand.js'

export default function Brand({ to = '/', onClick, light = false, compact = false }) {
  const src = compact ? '/masterly-icon.svg' : light ? '/masterly-logo-white.svg' : '/masterly-logo.svg'

  return (
    <Link
      to={to}
      onClick={onClick}
      className="inline-flex items-center rounded-md focus-visible:outline-offset-4"
      aria-label={BRAND_NAME}
    >
      <img
        src={src}
        alt={BRAND_NAME}
        width={compact ? 32 : 148}
        height={32}
        className={compact ? 'h-8 w-8' : 'h-8 w-auto'}
      />
    </Link>
  )
}
