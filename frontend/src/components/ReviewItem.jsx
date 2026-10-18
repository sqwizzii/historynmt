import { CheckCircle2, Clock3, Lightbulb, MessageSquareText, MinusCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import QuestionExplanation, { NO_EXPLANATION } from './QuestionExplanation.jsx'
import QuestionImages from './QuestionImages.jsx'
import ErrorAlert from './ErrorAlert.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from './styles.js'
import { getErrorMessage, resultService } from '../services/api.js'

function statusOf(item) {
  if (item.pendingManual) return { label: 'Очікує оцінки', Icon: Clock3, className: 'bg-amber-100 text-amber-900' }
  if (item.earned === item.max) return { label: 'Правильно', Icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800' }
  if (item.earned === 0) return { label: 'Неправильно', Icon: XCircle, className: 'bg-red-100 text-red-800' }
  return { label: 'Частково', Icon: MinusCircle, className: 'bg-slate-200 text-slate-900' }
}

function AnswerBlock({ title, lines, emptyText, tone }) {
  return (
    <div className={`rounded-xl p-3.5 ${tone}`}>
      <h3 className="mb-1.5 text-xs font-semibold opacity-70">{title}</h3>
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

function TeacherGradeForm({ resultId, item, onGraded }) {
  const [earned, setEarned] = useState(String(item.earned ?? 0))
  const [comment, setComment] = useState(item.teacherComment ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function save(complete = false) {
    const points = Number(earned)
    if (!Number.isInteger(points) || points < 0 || points > item.max) {
      return setError(`Бал має бути цілим числом від 0 до ${item.max}.`)
    }
    setError('')
    setLoading(true)
    try {
      const updated = await resultService.grade(resultId, {
        grades: [{ questionId: item.questionId, earned: points, comment: comment.trim() || null }],
        complete,
      })
      onGraded(updated)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
      <p className="text-sm font-semibold text-amber-950">Оцінити відкриту відповідь</p>
      <ErrorAlert message={error} />
      <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <div>
          <label htmlFor={`grade-${item.questionId}`} className="mb-1.5 block text-xs font-medium text-amber-900">
            Бали (0–{item.max})
          </label>
          <input
            id={`grade-${item.questionId}`}
            type="number"
            min="0"
            max={item.max}
            className={inputClass}
            value={earned}
            onChange={(e) => setEarned(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`comment-${item.questionId}`} className="mb-1.5 block text-xs font-medium text-amber-900">
            Коментар до питання
          </label>
          <input
            id={`comment-${item.questionId}`}
            className={inputClass}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Необовʼязково"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save(false)} disabled={loading} className={secondaryButtonClass}>
          {loading ? 'Зберігаємо…' : 'Зберегти оцінку'}
        </button>
        <button type="button" onClick={() => save(true)} disabled={loading} className={primaryButtonClass}>
          Зберегти й завершити
        </button>
      </div>
    </div>
  )
}

export default function ReviewItem({ item, number, testId, resultId, canGrade = false, onGraded }) {
  const status = statusOf(item)
  return (
    <article className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--color-mute)]">Питання {number}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold ${status.className}`}>
          <status.Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {status.label}: {item.earned} з {item.max}
        </span>
      </div>
      <QuestionImages main={item.imageUrl} extra={item.extraImageUrls} />
      <p className="mb-4 font-semibold leading-snug text-[var(--color-ink)]">{item.questionText}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <AnswerBlock
          title="Ваша відповідь"
          lines={item.yourAnswer ?? []}
          emptyText="Без відповіді"
          tone={item.pendingManual ? 'bg-amber-50 text-amber-950' : item.earned === item.max ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}
        />
        {item.correctAnswer?.length > 0 ? (
          <AnswerBlock title="Правильна відповідь" lines={item.correctAnswer} emptyText="-" tone="bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)]" />
        ) : item.needsManualGrading || item.pendingManual ? (
          <AnswerBlock title="Правильна відповідь" lines={[]} emptyText="Потребує ручної оцінки вчителя" tone="bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)]" />
        ) : (
          <AnswerBlock title="Правильна відповідь" lines={[]} emptyText="Вчитель не відкриває правильні відповіді для цього тесту" tone="bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)]" />
        )}
      </div>

      {item.teacherComment && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--color-surface-muted)] p-3.5 text-sm text-[var(--color-ink-soft)]">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">Коментар вчителя: </span>
            {item.teacherComment}
          </p>
        </div>
      )}

      {!item.explanation && item.correctAnswer?.length > 0 && (
        testId && item.earned < item.max && !item.pendingManual
          ? <QuestionExplanation testId={testId} questionId={item.questionId} lazy />
          : <p className="mt-3 text-xs text-[var(--color-mute)]">{NO_EXPLANATION}</p>
      )}
      {item.explanation && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3.5 text-sm text-blue-900">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{item.explanation}</p>
        </div>
      )}

      {canGrade && item.pendingManual && resultId && (
        <TeacherGradeForm resultId={resultId} item={item} onGraded={onGraded} />
      )}
    </article>
  )
}
