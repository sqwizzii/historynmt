import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../Modal.jsx'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import QuestionCard from '../questions/QuestionCard.jsx'
import ErrorAlert from '../ErrorAlert.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { useCountdown } from '../../hooks/useCountdown.js'
import { useExamGuard } from '../../hooks/useExamGuard.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { isAnswered } from '../../utils/answers.js'
import { pluralize } from '../../utils/format.js'
import AnswerFeedback from './AnswerFeedback.jsx'
import ResultModal from './ResultModal.jsx'

const AWAY_LIMIT_SECONDS = 15
const WARNING_THRESHOLD_MS = 5 * 60 * 1000

function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function TestSession({ testId }) {
  const { data: session, error: loadError, reload } = useAsyncData(
    async () => {
      const [test, attempt] = await Promise.all([testService.getById(testId), testService.start(testId)])
      return { test, attempt, startedAt: Date.now() }
    },
    testId,
  )
  const test = session?.test

  if (loadError) {
    return <ErrorState message={loadError.response?.status === 404 ? 'Тест не знайдено.' : getErrorMessage(loadError)} onRetry={reload} />
  }
  if (!test) return <LoadingState label="Завантажуємо тест…" />
  if (test.questions.length === 0) {
    return <EmptyState title="У цьому тесті ще немає питань" text="Спробуйте обрати інший тест." />
  }

  return <ActiveTest key={session.startedAt} testId={testId} test={test} attempt={session.attempt} onRetry={reload} />
}

function ActiveTest({ testId, test, attempt, onRetry }) {
  const navigate = useNavigate()
  const questions = test.questions
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState(() => Object.fromEntries((attempt.checked ?? []).map((item) => [item.questionId, item])))
  const [checking, setChecking] = useState(false)
  const showEach = test.answerVisibilityMode === 'AFTER_EACH_QUESTION'
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [autoReason, setAutoReason] = useState(null)
  const [leaves, setLeaves] = useState(attempt.leaveCount)
  const [notice, setNotice] = useState('')
  const [deadline] = useState(() => Date.now() + attempt.remainingSeconds * 1000)
  const timedOut = autoReason !== null

  const isDone = (q) => isAnswered(answers[q.id]) || Boolean(feedback[q.id])
  const answeredCount = questions.filter(isDone).length

  async function checkCurrent() {
    const q = questions[index]
    if (checking || feedback[q.id] || !isAnswered(answers[q.id])) return
    setChecking(true)
    setNotice('')
    try {
      const item = await testService.check(testId, q.id, answers[q.id])
      setFeedback((prev) => ({ ...prev, [q.id]: item }))
    } catch (err) {
      setNotice(getErrorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  async function submit(reason = autoReason ?? 'MANUAL') {
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')
    const payload = questions
      .filter((q) => isAnswered(answers[q.id]))
      .map((q) => ({ questionId: q.id, ...answers[q.id] }))
    try {
      const data = await testService.submit(testId, payload, reason)
      setConfirming(false)
      setResult(data)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const remainingMs = useCountdown(deadline, Boolean(result) || submitting || timedOut, () => {
    setAutoReason('TIMEOUT')
    submit('TIMEOUT')
  })

  useExamGuard({
    active: !result && !timedOut,
    awayLimitSeconds: AWAY_LIMIT_SECONDS,
    onLeave: () => {
      setLeaves((n) => n + 1)
      testService.recordLeave(testId).catch(() => {})
    },
    onReturn: (seconds) => setNotice(`Ви були поза сторінкою тесту ${seconds} с. Це зафіксовано.`),
    onTooLong: () => {
      setAutoReason('LEFT_PAGE')
      submit('LEFT_PAGE')
    },
    onBlockedNavigation: () => setNotice('Під час тесту переходити на інші сторінки не можна. Завершіть тест кнопкою внизу.'),
  })
  const lowTime = remainingMs <= WARNING_THRESHOLD_MS

  const question = questions[index]
  const isLast = index === questions.length - 1

  const unanswered = questions.length - answeredCount

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{test.title}</h1>
          <span
            role="timer"
            aria-label="Залишилось часу"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold tabular-nums ${
              lowTime ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatRemaining(remainingMs)}
          </span>
        </div>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Не залишайте сторінку: виходи фіксуються (поки що: {leaves}), а відсутність понад {AWAY_LIMIT_SECONDS} с автоматично завершить тест.
            {notice && <strong className="mt-1 block">{notice}</strong>}
          </span>
        </p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>
              Відповіли: {answeredCount} з {questions.length}
            </span>
            <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-xl bg-slate-200">
            <div className="h-full rounded-xl bg-blue-600 transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <nav aria-label="Навігація по питаннях" className="mb-5 flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const current = i === index
          const done = isDone(q)
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
        locked={Boolean(feedback[question.id])}
      >
        {showEach && !feedback[question.id] && (
          <div className="mt-5">
            <button type="button" onClick={checkCurrent} disabled={checking || !isAnswered(answers[question.id])} className={secondaryButtonClass}>
              {checking ? 'Перевіряємо…' : 'Перевірити відповідь'}
            </button>
            <p className="mt-2 text-xs text-slate-500">Після перевірки відповідь змінити не можна.</p>
          </div>
        )}
        {feedback[question.id] && <AnswerFeedback item={feedback[question.id]} testId={testId} />}
      </QuestionCard>

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

      {(confirming || timedOut) && !result && (
        <Modal
          title={autoReason === 'LEFT_PAGE' ? 'Тест завершено: ви залишили сторінку' : timedOut ? 'Час вичерпано' : 'Завершити тест?'}
          onClose={submitting || timedOut ? undefined : () => setConfirming(false)}
        >
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            {timedOut ? (
              <p>{submitting ? 'Надсилаємо ваші відповіді на перевірку…' : 'Відповіді не вдалося надіслати автоматично.'}</p>
            ) : (
              <>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                  Ви відповіли на {answeredCount} з {questions.length} {pluralize(questions.length, 'питання', 'питання', 'питань')}.
                </p>
                {unanswered > 0 && <p>Питань без відповіді: {unanswered}. Їх буде зараховано як неправильні.</p>}
              </>
            )}
            <ErrorAlert message={submitError} />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" onClick={() => submit()} disabled={submitting} className={`${primaryButtonClass} flex-1`}>
              {submitting ? 'Надсилаємо…' : timedOut ? 'Надіслати знову' : 'Завершити'}
            </button>
            {!timedOut && (
              <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className={`${secondaryButtonClass} flex-1`}>
                Повернутися
              </button>
            )}
          </div>
        </Modal>
      )}

      {result && <ResultModal
          result={result}
          autoReason={autoReason}
          onReview={() => navigate(`/results/${result.id}`)}
          onRetry={onRetry}
          onClose={() => navigate('/tests')}
        />}
    </div>
  )
}
