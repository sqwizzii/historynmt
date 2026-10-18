import { BarChart3, Copy, FileDown, ImageIcon, Pencil, Plus, Trash2, UserCheck } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { ErrorState, LoadingState } from '../PageState.jsx'
import { badgeClass, dangerGhostButtonClass, primaryButtonClass, secondaryButtonClass, softButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import QuestionForm from './QuestionForm.jsx'
import AssignModal from './AssignModal.jsx'
import TestForm from './TestForm.jsx'

const TYPE_LABELS = {
  SINGLE_CHOICE: 'Одна відповідь',
  MULTIPLE_CHOICE: 'Кілька відповідей',
  MATCHING: 'Відповідність',
  CHRONOLOGY: 'Хронологія',
  FILL_BLANK: 'Пропуски',
  OPEN: 'Відкрита відповідь',
}

function QuestionStats({ testId }) {
  const { data: stats, error } = useAsyncData(() => testService.getStats(testId), testId)
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)

  async function exportStats(format) {
    setExportError('')
    setExporting(true)
    try {
      await testService.exportStats(testId, format)
    } catch (err) {
      setExportError(getErrorMessage(err, 'Не вдалося експортувати статистику.'))
    } finally {
      setExporting(false)
    }
  }

  if (error) return null
  if (!stats) return null

  return (
    <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-card sm:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-[var(--color-ink)]">
          <BarChart3 className="h-4 w-4 text-[var(--color-accent-fg)]" aria-hidden="true" />
          Статистика по питаннях
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportStats('csv')} disabled={exporting} className={`${secondaryButtonClass} !px-3 !py-2 text-xs`}>
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
          <button type="button" onClick={() => exportStats('xlsx')} disabled={exporting} className={`${secondaryButtonClass} !px-3 !py-2 text-xs`}>
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            XLSX
          </button>
        </div>
      </div>
      {exportError && <p className="mb-3 text-xs text-[var(--color-danger-fg)]">{exportError}</p>}
      {stats.questions.length === 0 ? (
        <p className="text-sm text-[var(--color-mute)]">Тест ще ніхто не проходив.</p>
      ) : (
        <>
          <p className="mb-4 text-xs text-[var(--color-mute)]">Спроб: {stats.attempts}. Спочатку найскладніші питання.</p>
          <ul className="space-y-3.5">
            {stats.questions.map((q) => (
              <li key={q.questionId}>
                <div className="mb-1.5 flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-[var(--color-ink)]">{q.questionText}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-[var(--color-mute)]">
                    помилок: {q.wrong} з {q.answered}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div
                      className={`h-full rounded-full ${q.correctPercent < 40 ? 'bg-red-500' : q.correctPercent < 70 ? 'bg-[var(--color-mute)]' : 'bg-emerald-500'}`}
                      style={{ width: `${q.correctPercent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums text-[var(--color-ink)]">{q.correctPercent}%</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default function TestEditor({ testId, onChanged, onDeleted }) {
  const { data: test, error, reload } = useAsyncData(() => testService.getForEdit(testId), testId, { keepPrevious: true })
  const [editing, setEditing] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  if (error && !test) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!test) return <LoadingState />

  function refreshQuestions() {
    reload()
    onChanged()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      if (toDelete.kind === 'test') {
        await testService.remove(testId)
        onDeleted()
      } else {
        await testService.removeQuestion(toDelete.id)
        setToDelete(null)
        refreshQuestions()
      }
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-card">
        <div className="flex flex-col gap-3 border-b border-[var(--color-line-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-[0.9375rem] font-semibold text-[var(--color-ink)]">Параметри тесту</h2>
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={() => setAssigning(true)} className={softButtonClass}>
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              Призначити учням
            </button>
            <button type="button" onClick={() => setToDelete({ kind: 'test' })} className={dangerGhostButtonClass}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Видалити тест
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <TestForm
            key={`${test.id}-${test.title}-${test.timeLimitMinutes}-${test.description}-${test.subjectId}-${test.grade}-${test.scoringScale}-${test.answerVisibilityMode}-${test.shuffleQuestions}-${test.shuffleOptions}-${test.maxAttempts}-${test.availableFrom}-${test.availableUntil}`}
            initial={test}
            onSaved={refreshQuestions}
          />
        </div>
      </section>

      <QuestionStats testId={testId} />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[0.9375rem] font-semibold text-[var(--color-ink)]">Питання ({test.questions.length})</h2>
          {editing !== 'new' && (
            <button type="button" onClick={() => setEditing('new')} className={primaryButtonClass}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Додати питання
            </button>
          )}
        </div>

        {editing === 'new' && (
          <div className="mb-4">
            <QuestionForm testId={test.id} onSaved={refreshQuestions} onCancel={() => setEditing(null)} />
          </div>
        )}

        {test.questions.length === 0 && editing !== 'new' && (
          <p className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-10 text-center text-[0.8125rem] text-[var(--color-mute)]">
            У цьому тесті ще немає питань. Натисніть «Додати питання».
          </p>
        )}

        <ol className="space-y-2">
          {test.questions.map((question, index) =>
            editing === question.id ? (
              <li key={question.id} className="motion-alert">
                <QuestionForm
                  testId={test.id}
                  initial={question}
                  onSaved={() => {
                    setEditing(null)
                    refreshQuestions()
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li key={question.id} className="motion-alert flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-start sm:p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-inverse)] text-[0.6875rem] font-bold text-[var(--color-on-inverse)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.8125rem] font-medium text-[var(--color-ink)]">{question.questionText}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.6875rem] text-[var(--color-mute)]">
                    <span className={badgeClass('slate')}>{TYPE_LABELS[question.questionType] ?? question.questionType}</span>
                    {question.questionType === 'FILL_BLANK' ? (
                      <span>Пропусків: {new Set((question.options ?? []).map((o) => o.orderIndex ?? 0)).size}</span>
                    ) : question.questionType === 'OPEN' ? (
                      <span>Макс. {question.maxPoints ?? 1} б.</span>
                    ) : (
                      <span>Варіантів: {question.options.length}</span>
                    )}
                    {question.imageUrl && (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        з зображенням
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(question.id)}
                    className={`${secondaryButtonClass} !px-2.5 !py-2`}
                    aria-label={`Редагувати питання ${index + 1}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await testService.copyQuestion(testId, question.id)
                        refreshQuestions()
                      } catch (err) {
                        setDeleteError(getErrorMessage(err))
                      }
                    }}
                    className={`${secondaryButtonClass} !px-2.5 !py-2`}
                    aria-label={`Копіювати питання ${index + 1}`}
                    title="Копіювати питання"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete({ kind: 'question', id: question.id })}
                    className={`${secondaryButtonClass} !px-2.5 !py-2 hover:!border-[var(--color-danger-fg)]/25 hover:!bg-[var(--color-danger-soft)] hover:!text-[var(--color-danger-fg)]`}
                    aria-label={`Видалити питання ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ol>
      </section>

      {toDelete && (
        <ConfirmDialog
          title={toDelete.kind === 'test' ? 'Видалити тест?' : 'Видалити питання?'}
          message={
            toDelete.kind === 'test'
              ? 'Тест, усі його питання та результати учнів за цим тестом буде видалено безповоротно.'
              : 'Питання буде видалено з тесту. Вже збережені розбори результатів не зміняться.'
          }
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => {
            setToDelete(null)
            setDeleteError('')
          }}
        />
      )}
      {assigning && <AssignModal testId={testId} onClose={() => setAssigning(false)} />}
    </div>
  )
}
