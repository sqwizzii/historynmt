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
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8E9C]" aria-hidden="true" />
        )}
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''} ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
          }`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#8B8E9C] hover:bg-[#F0F1F5] hover:text-[#14151C]"
            aria-label={revealed ? 'Сховати пароль' : 'Показати пароль'}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[#6B6E7B]">{hint}</p>
      ) : null}
    </div>
  )
}
