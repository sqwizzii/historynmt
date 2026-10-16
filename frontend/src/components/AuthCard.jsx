import { CheckCircle2 } from 'lucide-react'
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand.js'
import Brand from './Brand.jsx'

const POINTS = [
  'Тести з таймером і автоперевіркою',
  'Картки та модулі за предметами',
  'Статистика по учнях і темах',
]

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="bg-auth-panel relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <Brand light />
        <div className="animate-fade-in">
          <p className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-white xl:text-6xl">{BRAND_NAME}</p>
          <p className="mt-5 max-w-sm text-lg leading-snug text-white/70">{BRAND_TAGLINE}</p>
          <ul className="mt-12 space-y-3.5 text-sm text-white/65">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/35">Для вчителів, репетиторів і онлайн-шкіл</p>
      </aside>
      <div className="bg-mesh flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[26rem] animate-fade-in rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-lift sm:p-8">
          <div className="mb-6 lg:hidden">
            <Brand />
          </div>
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)]">{subtitle}</p>
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-[var(--color-mute)]">{footer}</p>}
        </div>
      </div>
    </div>
  )
}
