import { Landmark } from 'lucide-react'
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand.js'

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-stretch gap-0 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-12">
      <aside className="bg-hero ornament relative hidden overflow-hidden border border-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="flex h-12 w-12 items-center justify-center border border-white/60">
          <Landmark className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-5xl font-semibold uppercase leading-[1.02]">
            {BRAND_NAME}
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-400">{BRAND_TAGLINE}</p>
        </div>
        <ul className="space-y-2 border-t border-white/30 pt-5 text-xs uppercase tracking-[0.14em] text-slate-300">
          <li>/ Тести з таймером і розбором відповідей</li>
          <li>/ Картки з фото для запам&apos;ятовування</li>
          <li>/ Автоматична робота над помилками</li>
        </ul>
      </aside>
      <div className="flex items-center justify-center border border-black bg-white p-6 sm:p-10 lg:border-l-0">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <h1 className="text-5xl text-black">{title}</h1>
            <p className="mt-3 text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>}
        </div>
      </div>
    </div>
  )
}
