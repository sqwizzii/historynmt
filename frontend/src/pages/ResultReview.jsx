import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import ReviewItem from '../components/ReviewItem.jsx'
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {isTeacher ? 'До панелі вчителя' : 'До моїх результатів'}
      </Link>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{result.testTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isTeacher && <span className="font-medium text-slate-700">{result.studentName} · </span>}
        {formatDate(result.completedAt)}
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs text-slate-500">Первинний бал</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">
            {result.score}
            {result.maxScore != null && <span className="text-sm font-medium text-slate-500"> з {result.maxScore}</span>}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs text-slate-500">Орієнт. бал НМТ</dt>
          <dd className="mt-1 text-lg font-bold text-blue-700">{result.nmtScore}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs text-slate-500">Правильність</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">
            {result.maxScore ? `${Math.round((result.score / result.maxScore) * 100)}%` : '-'}
          </dd>
        </div>
      </dl>

      {!result.review ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Для цього результату детальний розбір недоступний.
        </p>
      ) : (
        <ol className="mt-8 space-y-4">
          {result.review.map((item, index) => (
            <ReviewItem key={item.questionId} item={item} number={index + 1} />
          ))}
        </ol>
      )}
    </div>
  )
}
