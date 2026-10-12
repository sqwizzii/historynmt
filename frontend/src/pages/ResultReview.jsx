import { ArrowLeft, CheckCircle2, Lightbulb, MinusCircle, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import QuestionImage from '../components/QuestionImage.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../services/api.js'
import { formatDate } from '../utils/format.js'

function statusOf(item) {
  if (item.earned === item.max) return { label: 'Правильно', Icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800' }
  if (item.earned === 0) return { label: 'Неправильно', Icon: XCircle, className: 'bg-red-100 text-red-800' }
  return { label: 'Частково', Icon: MinusCircle, className: 'bg-amber-100 text-amber-800' }
}

function AnswerBlock({ title, lines, emptyText, tone }) {
  return (
    <div className={`rounded-xl p-3.5 ${tone}`}>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide opacity-70">{title}</h3>
      {lines.length === 0 ? (
        <p className="text-sm italic opacity-70">{emptyText}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {lines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

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
          {result.review.map((item, index) => {
            const status = statusOf(item)
            return (
              <li key={item.questionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-500">Питання {index + 1}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                    <status.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {status.label}: {item.earned} з {item.max}
                  </span>
                </div>
                <QuestionImage src={item.imageUrl} />
                <p className="mb-4 font-semibold leading-snug text-slate-900">{item.questionText}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AnswerBlock
                    title="Ваша відповідь"
                    lines={item.yourAnswer}
                    emptyText="Без відповіді"
                    tone={item.earned === item.max ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}
                  />
                  <AnswerBlock title="Правильна відповідь" lines={item.correctAnswer} emptyText="-" tone="bg-slate-50 text-slate-800" />
                </div>
                {item.explanation && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3.5 text-sm text-blue-900">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>{item.explanation}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
