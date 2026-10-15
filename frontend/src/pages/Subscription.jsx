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
      <PageHeader title="Тарифи" description="Два плани з однаковими можливостями: відрізняється лише період доступу. Учням підписка не потрібна." />
      {status && (
        <section className={`${cardClass} mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`} aria-live="polite">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${status.active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <Clock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{status.active ? 'Підписка активна' : 'Підписка не активна'}</p>
              <p className="text-sm text-slate-600">
                {status.expiresAt
                  ? `Діє до ${formatDate(status.expiresAt)}`
                  : status.legacyFreeAccess
                    ? 'Тимчасовий безкоштовний доступ для наявних користувачів.'
                    : 'Перегляд ваших даних доступний, створення й редагування матеріалів заблоковано.'}
              </p>
            </div>
          </div>
        </section>
      )}
      <PlanCards plans={plans.data} highlight={status?.active ? status.plan : null} />
      <section className={`${cardClass} mt-6 p-5 text-sm text-slate-600`}>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Як активувати доступ</h2>
        <p>Онлайн-оплата поки не підключена. Підписку активує, продовжує або скасовує адміністратор платформи вручну; після активації доступ відкривається автоматично.</p>
        {!isAuthenticated && <Link to="/register/teacher" className={`${primaryButtonClass} mt-4`}>Створити акаунт вчителя</Link>}
      </section>
    </div>
  )
}
