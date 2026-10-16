import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import ReviewItem from '../components/ReviewItem.jsx'
import { cardClass } from '../components/styles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../services/api.js'
import { formatDate } from '../utils/format.js'

export default function ResultReview() {
  const { resultId } = useParams()
  const { isTeacher } = useAuth()
  const { data: result, error, reload } = useAsyncData(() => resultService.getById(resultId), resultId)

  if (error) {
    const message = error.response?.status === 404 ? 'Результат не знайдено.' : getErrorMessage(error)
    return <ErrorState message={message} onRetry={reload} />
  }
  if (!result) return <LoadingState label="Завантажуємо розбір…" />

  const backTo = isTeacher ? '/teacher' : '/results'

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {isTeacher ? 'До панелі вчителя' : 'До моїх результатів'}
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[1.35rem]">{result.testTitle}</h1>
      <p className="mt-1.5 text-sm text-[var(--color-mute)]">
        {isTeacher && <span className="font-medium text-[var(--color-ink)]">{result.studentName} · </span>}
        {formatDate(result.completedAt)}
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center stagger">
        <div className={`${cardClass} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
          <dt className="text-[11px] font-medium text-[var(--color-mute)]">Первинний бал</dt>
          <dd className="mt-1.5 text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            {result.score}
            {result.maxScore != null && <span className="text-sm font-medium text-[var(--color-mute)]"> з {result.maxScore}</span>}
          </dd>
        </div>
        <div className={`${cardClass} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
          <dt className="text-[11px] font-medium text-[var(--color-mute)]">Орієнт. бал НМТ</dt>
          <dd className="mt-1.5 text-lg font-semibold tabular-nums text-indigo-700">{result.nmtScore}</dd>
        </div>
        <div className={`${cardClass} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
          <dt className="text-[11px] font-medium text-[var(--color-mute)]">Правильність</dt>
          <dd className="mt-1.5 text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            {result.maxScore ? `${Math.round((result.score / result.maxScore) * 100)}%` : '-'}
          </dd>
        </div>
      </dl>

      {!result.review ? (
        <p className="mt-8 rounded-xl border border-dashed border-[#c9ced9] bg-white px-4 py-8 text-center text-sm text-[var(--color-mute)]">
          Для цього результату детальний розбір недоступний.
        </p>
      ) : (
        <ol className="mt-8 space-y-4 stagger">
          {result.review.map((item, index) => (
            <li key={item.questionId}>
              <ReviewItem item={item} number={index + 1} testId={isTeacher ? undefined : result.testId} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
