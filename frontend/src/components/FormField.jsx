import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { inputClass, labelClass } from './styles.js'

export default function FormField({ label, icon: Icon, type = 'text', hint, error, ...inputProps }) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-mute-soft)]" aria-hidden="true" />
        )}
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} ${Icon ? 'pl-11' : ''} ${isPassword ? 'pr-12' : ''} ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
          }`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--color-mute-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
            aria-label={revealed ? 'Сховати пароль' : 'Показати пароль'}
          >
            {revealed ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-[0.75rem] text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-[var(--color-mute)]">{hint}</p>
      ) : null}
    </div>
  )
}
