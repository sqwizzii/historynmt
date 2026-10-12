import { ArrowLeft, ArrowRight, CheckCircle2, Flag } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../Modal.jsx'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import QuestionCard from '../questions/QuestionCard.jsx'
import ErrorAlert from '../ErrorAlert.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { pluralize } from '../../utils/format.js'
import ResultModal from './ResultModal.jsx'

const NO_QUESTIONS = []

function isAnswered(answer) {
  if (!answer) return false
  if (answer.selectedOptionIds) return answer.selectedOptionIds.length > 0
  if (answer.matches) return Object.keys(answer.matches).length > 0
  if (answer.orderedOptionIds) return answer.orderedOptionIds.length > 0
  return false
}

export default function TestSession({ testId }) {
  const navigate = useNavigate()
  const { data: test, error: loadError, reload } = useAsyncData(() => testService.getById(testId), testId)
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  const questions = test ? test.questions : NO_QUESTIONS
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length

  if (loadError) {
    return <ErrorState message={loadError.response?.status === 404 ? 'Тест не знайдено.' : getErrorMessage(loadError)} onRetry={reload} />
  }
  if (!test) return <LoadingState label="Завантажуємо тест…" />
  if (questions.length === 0) {
    return <EmptyState title="У цьому тесті ще немає питань" text="Спробуйте обрати інший тест." />
  }

  const question = questions[index]
  const isLast = index === questions.length - 1

  async function submit() {
    setSubmitting(true)
    setSubmitError('')
    const payload = questions
      .filter((q) => isAnswered(answers[q.id]))
      .map((q) => ({ questionId: q.id, ...answers[q.id] }))
    try {
      const data = await testService.submit(testId, payload)
      setConfirming(false)
      setResult(data)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function retry() {
    setAnswers({})
    setIndex(0)
    setResult(null)
  }

  const unanswered = questions.length - answeredCount

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <Link to="/tests" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          До списку тестів
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{test.title}</h1>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>
              Відповіли: {answeredCount} з {questions.length}
            </span>
            <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <nav aria-label="Навігація по питаннях" className="mb-5 flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const current = i === index
          const done = isAnswered(answers[q.id])
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={current ? 'step' : undefined}
              aria-label={`Питання ${i + 1}${done ? ', є відповідь' : ''}`}
              className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
                current
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : done
                    ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </nav>

      <QuestionCard
        key={question.id}
        question={question}
        number={index + 1}
        total={questions.length}
        value={answers[question.id]}
        onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className={secondaryButtonClass}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </button>
        {isLast ? (
          <button type="button" onClick={() => setConfirming(true)} className={primaryButtonClass}>
            <Flag className="h-4 w-4" aria-hidden="true" />
            Завершити тест
          </button>
        ) : (
          <button type="button" onClick={() => setIndex((i) => i + 1)} className={primaryButtonClass}>
            Далі
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {!isLast && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-blue-700 hover:underline">
            Завершити тест достроково
          </button>
        </div>
      )}

      {confirming && !result && (
        <Modal title="Завершити тест?" onClose={submitting ? undefined : () => setConfirming(false)}>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              Ви відповіли на {answeredCount} з {questions.length} {pluralize(questions.length, 'питання', 'питання', 'питань')}.
            </p>
            {unanswered > 0 && <p>Питань без відповіді: {unanswered}. Їх буде зараховано як неправильні.</p>}
            <ErrorAlert message={submitError} />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" onClick={submit} disabled={submitting} className={`${primaryButtonClass} flex-1`}>
              {submitting ? 'Надсилаємо…' : 'Завершити'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className={`${secondaryButtonClass} flex-1`}>
              Повернутися
            </button>
          </div>
        </Modal>
      )}

      {result && <ResultModal result={result} onRetry={retry} onClose={() => navigate('/tests')} />}
    </div>
  )
}
