import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { primaryButtonClass } from '../components/styles.js'

export default function ComingSoon({ title = 'Сторінку не знайдено', message = 'Перевірте адресу або поверніться на головну.' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-ink)] text-white">
        <Construction className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--color-mute)]">{message}</p>
      <Link to="/" className={`${primaryButtonClass} mt-6`}>
        На головну
      </Link>
    </div>
  )
}
