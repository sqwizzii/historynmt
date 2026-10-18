import { CheckCircle2 } from 'lucide-react'
import BlobCard from './BlobCard.jsx'
import Stagger from './motion/Stagger.jsx'
import { badgeClass } from './styles.js'

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
        const selected = highlight === plan.plan
        return (
          <BlobCard
            key={plan.plan}
            className={`group relative flex flex-col ${
              selected ? 'blob-card--selected' : featured ? 'blob-card--featured' : ''
            }`}
          >
            {featured && !selected && (
              <span className={`${badgeClass('indigo')} absolute right-4 top-4 z-10`}>{`Найкраще на рік`}</span>
            )}
            <div className="flex items-center justify-between gap-2 pr-24">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{plan.name}</h3>
              {selected && <span className={badgeClass('green')}>Ваш план</span>}
            </div>
            <p className="mt-1 text-[0.9375rem] text-[var(--color-mute)]">
              Доступ {PERIOD[plan.plan]} · {plan.periodDays} днів
            </p>
            <p className="mt-6 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] transition duration-300 group-hover:text-[var(--color-accent-fg)]">
              Вартість уточнюється
            </p>
            <ul className="mt-6 space-y-2.5 border-t border-[var(--color-line-soft)] pt-5 text-[0.9375rem] text-[var(--color-ink-soft)]">
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-fg)] transition group-hover:scale-110" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </BlobCard>
        )
      })}
    </Stagger>
  )
}
