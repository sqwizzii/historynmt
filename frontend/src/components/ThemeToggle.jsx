import { useId } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

/**
 * Theme switch adapted from Uiverse.io by alexruix (splendid-liger-23).
 * Keeps Masterly ThemeProvider / localStorage / prefers-color-scheme behavior.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const id = useId()
  const label = isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'

  return (
    <label className={`theme-switch ${className}`.trim()} htmlFor={id} title={label}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={isDark}
        onChange={toggleTheme}
        aria-checked={isDark}
        aria-label={label}
      />
      <span className="theme-switch__slider" aria-hidden="true" />
    </label>
  )
}
