import { ArrowLeft, ArrowRight, CheckCircle2, Flag, PartyPopper, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/PageState.jsx'
import QuestionCard from '../components/questions/QuestionCard.jsx'
import ReviewItem from '../components/ReviewItem.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, practiceService } from '../services/api.js'
import { isAnswered } from '../utils/answers.js'

function Session({ questions, onFinish }) {
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function check() {
    setChecking(true)
    setError('')
    try {
      const payload = questions.map((q) => ({ questionId: q.id, ...(isAnswered(answers[q.id]) ? answers[q.id] : {}) }))
      setResult(await practiceService.check(payload))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  if (result) {
    return (
      <div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 text-center">
          <PartyPopper className="mx-auto h-8 w-8 text-[var(--color-accent-fg)]" aria-hidden="true" />
          <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
            Виправлено: {result.fixed} з {result.total}
          </p>
          <p className="mt-1 text-sm text-[var(--color-mute)]">
            {result.fixed === result.total ? 'Усі помилки виправлено, так тримати!' : 'Питання, які не вдалися, залишаться в списку для наступного разу.'}
          </p>
          <button type="button" onClick={onFinish} className={`${primaryButtonClass} mt-4`}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Далі
          </button>
        </div>
        <ol className="mt-6 space-y-4">
          {result.review.map((item, i) => (
            <li key={item.questionId}>
              <ReviewItem item={item} number={i + 1} />
            </li>
          ))}
        </ol>
      </div>
    )
  }

  const question = questions[index]
  const isLast = index === questions.length - 1
  const answered = questions.filter((q) => isAnswered(answers[q.id])).length

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--color-mute)]">
        Відповіли: {answered} з {questions.length}
      </p>
      <div key={question.id} className="motion-question">
        <QuestionCard
          question={question}
          number={index + 1}
          total={questions.length}
          value={answers[question.id]}
          onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
        />
      </div>
      <ErrorAlert message={error} />
      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className={secondaryButtonClass}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </button>
        {isLast ? (
          <button type="button" onClick={check} disabled={checking} className={primaryButtonClass}>
            <Flag className="h-4 w-4" aria-hidden="true" />
            {checking ? 'Перевіряємо…' : 'Перевірити'}
          </button>
        ) : (
          <button type="button" onClick={() => setIndex((i) => i + 1)} className={primaryButtonClass}>
            Далі
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Practice() {
  const { data, error, reload } = useAsyncData(practiceService.getMistakes)
  const [started, setStarted] = useState(false)

  let content
  if (error) content = <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  else if (!data) content = <LoadingState label="Шукаємо ваші помилки…" />
  else if (data.total === 0) {
    content = (
      <EmptyState
        title="Помилок для повторення немає"
        text="Пройдіть тест, і питання, на які ви відповіли неправильно, з'являться тут."
      />
    )
  } else if (!started) {
    content = (
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-accent-fg)]" aria-hidden="true" />
        <p className="mt-3 text-lg font-bold text-[var(--color-ink)]">Питань для повторення: {data.total}</p>
        <p className="mt-1 text-sm text-[var(--color-mute)]">
          Зараз у підборці {data.questions.length}. Правильна відповідь прибирає питання зі списку, помилка залишає його.
        </p>
        <button type="button" onClick={() => setStarted(true)} className={`${primaryButtonClass} mt-5`}>
          Почати
        </button>
      </div>
    )
  } else {
    content = (
      <Session
        questions={data.questions}
        onFinish={() => {
          setStarted(false)
          reload()
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/results" className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        До моїх результатів
      </Link>
      <h1 className="mb-6 text-xl font-bold tracking-tight text-[var(--color-ink)] sm:text-2xl">Робота над помилками</h1>
      {content}
    </div>
  )
}
