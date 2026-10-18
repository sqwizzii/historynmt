import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { ghostButtonClass } from './styles.js'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${ghostButtonClass} !p-2 ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
