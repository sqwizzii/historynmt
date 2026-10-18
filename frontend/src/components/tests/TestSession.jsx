import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
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

function restoreAnswers(draftKey, lockedAnswers) {
  let restored = {}
  try {
    restored = JSON.parse(localStorage.getItem(draftKey) ?? '{}') ?? {}
  } catch {
    restored = {}
  }
  for (const { questionId, ...value } of lockedAnswers ?? []) {
    restored[questionId] = Object.fromEntries(Object.entries(value).filter(([, v]) => v != null))
  }
  return restored
}

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
  const draftKey = `test-draft:${attempt.attemptId}`
  const [answers, setAnswers] = useState(() => restoreAnswers(draftKey, attempt.lockedAnswers))
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

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers))
    } catch {
      // сховище недоступне: відповіді просто не відновлюватимуться після перезавантаження
    }
  }, [draftKey, answers])

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
      localStorage.removeItem(draftKey)
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
      <header className="mb-5 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-card">
        <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
          <h1 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] sm:text-xl">{test.title}</h1>
          <span
            role="timer"
            aria-label="Залишилось часу"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${
              lowTime
                ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger-fg)] ring-1 ring-[var(--color-danger-fg)]/25'
                : 'bg-[var(--color-inverse)] text-[var(--color-on-inverse)]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatRemaining(remainingMs)}
          </span>
        </div>
        <p className="mx-4 mb-4 flex items-start gap-2 rounded-lg bg-[var(--color-warning-soft)] px-3 py-2.5 text-[0.75rem] leading-relaxed text-[var(--color-warning-fg)] sm:mx-5">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Не залишайте сторінку: виходи фіксуються ({leaves}), відсутність понад {AWAY_LIMIT_SECONDS} с завершить тест.
            {notice && <strong className="mt-1 block">{notice}</strong>}
          </span>
        </p>
        <div className="border-t border-[var(--color-line-soft)] px-4 py-3 sm:px-5">
          <div className="mb-1.5 flex justify-between text-[0.6875rem] text-[var(--color-mute)]">
            <span>
              Відповіли: {answeredCount} з {questions.length}
            </span>
            <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div
              className="h-full rounded-full bg-indigo-600 transition-[width] duration-500 ease-out"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <nav aria-label="Навігація по питаннях" className="mb-4 flex flex-wrap gap-1.5">
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
              className={`h-8 min-w-8 rounded-md border px-2 text-[0.75rem] font-semibold transition-colors ${
                current
                  ? 'border-[var(--color-inverse)] bg-[var(--color-inverse)] text-[var(--color-on-inverse)]'
                  : done
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                    : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-mute)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </nav>

      <div key={question.id} className="motion-question">
      <QuestionCard
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
            <p className="mt-2 text-xs text-[var(--color-mute)]">Після перевірки відповідь змінити не можна.</p>
          </div>
        )}
        {feedback[question.id] && <AnswerFeedback item={feedback[question.id]} testId={testId} />}
      </QuestionCard>
      </div>

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
          <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-[var(--color-mute)] underline-offset-2 hover:text-[var(--color-accent-fg)] hover:underline">
            Завершити тест достроково
          </button>
        </div>
      )}

      {(confirming || timedOut) && !result && (
        <Modal
          title={autoReason === 'LEFT_PAGE' ? 'Тест завершено: ви залишили сторінку' : timedOut ? 'Час вичерпано' : 'Завершити тест?'}
          onClose={submitting || timedOut ? undefined : () => setConfirming(false)}
        >
          <div className="mt-3 space-y-3 text-sm text-[var(--color-mute)]">
            {timedOut ? (
              <p>{submitting ? 'Надсилаємо ваші відповіді на перевірку…' : 'Відповіді не вдалося надіслати автоматично.'}</p>
            ) : (
              <>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-fg)]" aria-hidden="true" />
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
