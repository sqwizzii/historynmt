import { CheckCircle2 } from 'lucide-react'
import { BRAND_TAGLINE } from '../config/brand.js'
import Brand from './Brand.jsx'

const POINTS = [
  'Тести з таймером і автоматичною перевіркою',
  'Картки та модулі за предметами й класами',
  'Статистика по учнях і темах',
]

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="bg-hero relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-30 grid-lines" aria-hidden="true" />
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative">
          <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">{BRAND_TAGLINE}</p>
          <ul className="mt-8 space-y-3.5 text-sm text-indigo-100">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-200" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-indigo-200/90">Для вчителів, репетиторів і онлайн-шкіл</p>
      </aside>
      <div className="grid-lines flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-[#E6E8F0] bg-white p-6 shadow-lift sm:p-8">
          <div className="mb-6 lg:hidden">
            <Brand />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#20212B]">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[#73758A]">{subtitle}</p>
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-[#73758A]">{footer}</p>}
        </div>
      </div>
    </div>
  )
}
