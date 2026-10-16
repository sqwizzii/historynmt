import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import PlanCards from '../components/PlanCards.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import { cardClass, primaryButtonClass } from '../components/styles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, subscriptionService } from '../services/api.js'
import { formatDate } from '../utils/format.js'

export default function Subscription() {
  const { isTeacher, isAuthenticated } = useAuth()
  const plans = useAsyncData(subscriptionService.plans)
  const me = useAsyncData(() => (isTeacher ? subscriptionService.me() : Promise.resolve(null)), isTeacher)

  if (plans.error) return <ErrorState message={getErrorMessage(plans.error)} onRetry={plans.reload} />
  if (!plans.data || (isTeacher && !me.data && !me.error)) return <LoadingState />
  const status = me.data

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Тарифи"
        description="Два плани з однаковими можливостями. Учням підписка не потрібна."
      />
      {status && (
        <section
          className={`${cardClass} mb-5 flex flex-col gap-3 border-l-[3px] p-4 sm:flex-row sm:items-center sm:justify-between ${
            status.active ? 'border-l-emerald-500' : 'border-l-amber-500'
          }`}
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                status.active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[#14151C]">
                {status.active ? 'Підписка активна' : 'Підписка не активна'}
              </p>
              <p className="mt-0.5 text-[13px] text-[#6B6E7B]">
                {status.expiresAt
                  ? `Діє до ${formatDate(status.expiresAt)}`
                  : status.legacyFreeAccess
                    ? 'Тимчасовий безкоштовний доступ.'
                    : 'Перегляд доступний; створення й редагування — ні.'}
              </p>
            </div>
          </div>
        </section>
      )}
      <PlanCards plans={plans.data} highlight={status?.active ? status.plan : null} />
      <section className={`${cardClass} mt-5 p-5 text-[13px] leading-relaxed text-[#6B6E7B]`}>
        <h2 className="mb-1 text-[14px] font-semibold text-[#14151C]">Як активувати доступ</h2>
        <p>
          Онлайн-оплата поки не підключена. Підписку активує адміністратор платформи вручну; після цього доступ
          відкривається автоматично.
        </p>
        {!isAuthenticated && (
          <Link to="/register/teacher" className={`${primaryButtonClass} mt-4`}>
            Створити акаунт вчителя
          </Link>
        )}
      </section>
    </div>
  )
}
