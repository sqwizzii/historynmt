import { CheckCircle2 } from 'lucide-react'
import Stagger from './motion/Stagger.jsx'
import { badgeClass, cardClass } from './styles.js'

const PLAN_FEATURES = [
  'Необмежені тести, картки й модулі',
  'Учні, коди запрошень і призначення',
  'Статистика по учнях, темах і питаннях',
  'Імпорт тестів із Google Forms',
]

const PERIOD = { MONTHLY: 'на місяць', YEARLY: 'на рік' }

export default function PlanCards({ plans, highlight }) {
  return (
    <Stagger immediate className="grid gap-4 md:grid-cols-2" step={100}>
      {plans.map((plan) => {
        const featured = plan.plan === 'YEARLY'
        return (
          <article
            key={plan.plan}
            className={`${cardClass} group relative flex flex-col overflow-hidden p-6 sm:p-7 hover:-translate-y-1.5 hover:shadow-lift ${
              highlight === plan.plan
                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--color-canvas)]'
                : featured
                  ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white'
                  : ''
            }`}
          >
            {featured && highlight !== plan.plan && (
              <span className={`${badgeClass('indigo')} absolute right-4 top-4`}>{`Найкраще на рік`}</span>
            )}
            <div className="flex items-center justify-between gap-2 pr-24">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{plan.name}</h3>
              {highlight === plan.plan && <span className={badgeClass('green')}>Ваш план</span>}
            </div>
            <p className="mt-1 text-[0.9375rem] text-[var(--color-mute)]">
              Доступ {PERIOD[plan.plan]} · {plan.periodDays} днів
            </p>
            <p className="mt-6 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] transition duration-300 group-hover:text-indigo-700">
              Вартість уточнюється
            </p>
            <ul className="mt-6 space-y-2.5 border-t border-[var(--color-line-soft)] pt-5 text-[0.9375rem] text-[#2f313c]">
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 transition group-hover:scale-110" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        )
      })}
    </Stagger>
  )
}
