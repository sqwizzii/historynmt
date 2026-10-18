import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../config/brand.js'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Brand({ to = '/', onClick, light = false, compact = false }) {
  const { isDark } = useTheme()
  const useLightLogo = light || isDark
  const src = compact ? '/masterly-icon.svg' : useLightLogo ? '/masterly-logo-white.svg' : '/masterly-logo.svg'

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
        width={compact ? 36 : 160}
        height={36}
        className={compact ? 'h-9 w-9' : 'h-9 w-auto'}
      />
    </Link>
  )
}
