import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'

export default function FormField({ label, icon: Icon, type = 'text', hint, ...inputProps }) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          className={`block w-full rounded-none border border-black/30 bg-white py-3 text-sm text-black placeholder:text-slate-400 transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black ${Icon ? 'pl-10' : 'pl-3'} ${isPassword ? 'pr-11' : 'pr-3'}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700"
            aria-label={revealed ? 'Сховати пароль' : 'Показати пароль'}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
