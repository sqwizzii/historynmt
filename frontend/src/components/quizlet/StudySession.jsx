import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, quizletService } from '../../services/api.js'
import FlipCard from './FlipCard.jsx'

export default function StudySession({ moduleId }) {
  const { data: module, error, reload } = useAsyncData(() => quizletService.getModule(moduleId), moduleId)
  const [index, setIndex] = useState(0)

  const total = module?.flashcards.length ?? 0

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.closest?.('input, textarea, select')) return
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, total - 1))
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [total])

  if (error) {
    return <ErrorState message={error.response?.status === 404 ? 'Модуль не знайдено.' : getErrorMessage(error)} onRetry={reload} />
  }
  if (!module) return <LoadingState label="Завантажуємо картки…" />

  const backLink = (
    <Link to="/quizlet" className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)]">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      До модулів
    </Link>
  )

  if (total === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        {backLink}
        <EmptyState title="У цьому модулі ще немає карток" text="Спробуйте обрати інший модуль." />
      </div>
    )
  }

  const card = module.flashcards[index]
  const progress = ((index + 1) / total) * 100

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        {backLink}
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)] sm:text-2xl">{module.title}</h1>
        {module.description && <p className="mt-1 text-sm text-[var(--color-mute)]">{module.description}</p>}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-[var(--color-mute)]">
            <span>
              Картка {index + 1} з {total}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-xl bg-[var(--color-line)]"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
          >
            <div className="h-full rounded-xl bg-[var(--color-mute)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <FlipCard key={card.id} card={card} />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className={secondaryButtonClass}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </button>
        <button type="button" onClick={() => setIndex(0)} className="rounded-lg p-2 text-[var(--color-mute)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]" aria-label="Почати спочатку" title="Почати спочатку">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => setIndex((i) => i + 1)} disabled={index === total - 1} className={primaryButtonClass}>
          Далі
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--color-mute-soft)]">Підказка: клавіші ← та → перемикають картки.</p>
    </div>
  )
}
