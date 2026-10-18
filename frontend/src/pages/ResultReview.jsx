import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert.jsx'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import ReviewItem from '../components/ReviewItem.jsx'
import { badgeClass, cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../services/api.js'
import { formatDate } from '../utils/format.js'

export default function ResultReview() {
  const { resultId } = useParams()
  const { isTeacher } = useAuth()
  const { data: loaded, error, reload } = useAsyncData(() => resultService.getById(resultId), resultId)
  const [override, setOverride] = useState(null)
  const current = override?.id === loaded?.id ? override : loaded
  const [teacherComment, setTeacherComment] = useState('')
  const [gradeError, setGradeError] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  useEffect(() => {
    setOverride(null)
  }, [resultId])

  useEffect(() => {
    if (current) setTeacherComment(current.teacherComment ?? '')
  }, [current?.id, current?.teacherComment])

  if (error) {
    const message = error.response?.status === 404 ? 'Результат не знайдено.' : getErrorMessage(error)
    return <ErrorState message={message} onRetry={reload} />
  }
  if (!current) return <LoadingState label="Завантажуємо розбір…" />

  const backTo = isTeacher ? '/teacher/students' : '/results'
  const pending = current.gradingStatus === 'PENDING_REVIEW' || (current.pendingManualCount ?? 0) > 0
  const canGrade = isTeacher && pending

  async function saveTeacherComment(complete = false) {
    setGradeError('')
    setSavingComment(true)
    try {
      const updated = await resultService.grade(resultId, {
        grades: [],
        teacherComment: teacherComment.trim() || null,
        complete,
      })
      setOverride(updated)
    } catch (err) {
      setGradeError(getErrorMessage(err))
    } finally {
      setSavingComment(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {isTeacher ? 'До учнів і результатів' : 'До моїх результатів'}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[1.35rem]">{current.testTitle}</h1>
          <p className="mt-1.5 text-sm text-[var(--color-mute)]">
            {isTeacher && <span className="font-medium text-[var(--color-ink)]">{current.studentName} · </span>}
            {formatDate(current.completedAt)}
          </p>
        </div>
        {pending ? (
          <span className={badgeClass('amber')}>Очікує перевірки{current.pendingManualCount ? ` · ${current.pendingManualCount}` : ''}</span>
        ) : (
          <span className={badgeClass('green')}>Оцінено</span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center stagger">
        <div className={`${cardClass} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
          <dt className="text-[0.6875rem] font-medium text-[var(--color-mute)]">Первинний бал</dt>
          <dd className="mt-1.5 text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            {current.score}
            {current.maxScore != null && <span className="text-sm font-medium text-[var(--color-mute)]"> з {current.maxScore}</span>}
          </dd>
        </div>
        <div className={`${cardClass} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
          <dt className="text-[0.6875rem] font-medium text-[var(--color-mute)]">Орієнт. бал НМТ</dt>
          <dd className="mt-1.5 text-lg font-semibold tabular-nums text-indigo-700">{current.nmtScore ?? '—'}</dd>
        </div>
        <div className={`${cardClass} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}>
          <dt className="text-[0.6875rem] font-medium text-[var(--color-mute)]">Правильність</dt>
          <dd className="mt-1.5 text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            {current.maxScore ? `${Math.round((current.score / current.maxScore) * 100)}%` : '-'}
          </dd>
        </div>
      </dl>

      {current.teacherComment && !canGrade && (
        <p className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          <span className="font-semibold text-[var(--color-ink)]">Коментар вчителя: </span>
          {current.teacherComment}
        </p>
      )}

      {canGrade && (
        <section className="mt-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-amber-950">Перевірка вчителя</h2>
          <p className="text-xs text-amber-900/80">
            Відкриті відповіді нижче потребують оцінки. Після виставлення балів можна завершити перевірку.
          </p>
          <ErrorAlert message={gradeError} />
          <div>
            <label htmlFor="result-teacher-comment" className="mb-1.5 block text-sm font-medium text-amber-950">
              Загальний коментар
            </label>
            <textarea
              id="result-teacher-comment"
              rows={2}
              className={inputClass}
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              placeholder="Необовʼязково"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => saveTeacherComment(false)} disabled={savingComment} className={secondaryButtonClass}>
              Зберегти коментар
            </button>
            <button type="button" onClick={() => saveTeacherComment(true)} disabled={savingComment} className={primaryButtonClass}>
              {savingComment ? 'Зберігаємо…' : 'Завершити перевірку'}
            </button>
          </div>
        </section>
      )}

      {!current.review ? (
        <p className="mt-8 rounded-xl border border-dashed border-[#c9ced9] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-mute)]">
          Для цього результату детальний розбір недоступний.
        </p>
      ) : (
        <ol className="mt-8 space-y-4 stagger">
          {current.review.map((item, index) => (
            <li key={item.questionId}>
              <ReviewItem
                item={item}
                number={index + 1}
                testId={isTeacher ? undefined : current.testId}
                resultId={current.id}
                canGrade={canGrade}
                onGraded={setOverride}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
