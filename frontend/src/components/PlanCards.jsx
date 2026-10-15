import { CheckCircle2 } from 'lucide-react'
import { badgeClass, cardClass } from './styles.js'

const PLAN_FEATURES = [
  'Необмежені тести, картки й модулі',
  'Учні, коди запрошень і призначення тестів',
  'Статистика по учнях, темах і питаннях',
  'Імпорт тестів із Google Forms',
]

const PERIOD = { MONTHLY: 'на місяць', YEARLY: 'на рік' }

export default function PlanCards({ plans, highlight }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {plans.map((plan) => (
        <article key={plan.plan} className={`${cardClass} flex flex-col p-6 ${highlight === plan.plan ? 'ring-2 ring-indigo-500' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
            {highlight === plan.plan && <span className={badgeClass('green')}>Ваш план</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">Доступ {PERIOD[plan.plan]} · {plan.periodDays} днів</p>
          <p className="mt-4 text-sm font-medium text-slate-700">Вартість уточнюється</p>
          <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )
}

