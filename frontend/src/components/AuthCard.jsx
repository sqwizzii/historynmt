import { Landmark, Quote } from 'lucide-react'

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-stretch gap-0 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-12">
      <aside className="bg-hero ornament relative hidden overflow-hidden rounded-l-[2rem] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-gold-soft ring-1 ring-white/20 backdrop-blur">
          <Landmark className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <Quote className="mb-4 h-8 w-8 text-gold" aria-hidden="true" />
          <p className="text-3xl font-bold leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
            Хто не знає свого минулого, той не вартий майбутнього.
          </p>
          <p className="mt-4 text-sm text-blue-200">Підготовка до НМТ з історії України</p>
        </div>
        <ul className="space-y-2 text-sm text-blue-100/90">
          <li>• Тести у форматі НМТ з розбором</li>
          <li>• Картки з фото для запам&apos;ятовування</li>
          <li>• Автоматична робота над помилками</li>
        </ul>
      </aside>
      <div className="flex items-center justify-center rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-card backdrop-blur sm:p-10 lg:rounded-l-none lg:rounded-r-[2rem]">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-ink">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>}
        </div>
      </div>
    </div>
  )
}
