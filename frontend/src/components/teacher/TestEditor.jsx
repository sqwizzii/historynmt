import { BarChart3, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { ErrorState, LoadingState } from '../PageState.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import QuestionForm from './QuestionForm.jsx'
import TestForm from './TestForm.jsx'

const TYPE_LABELS = {
  SINGLE_CHOICE: 'Одна відповідь',
  MULTIPLE_CHOICE: 'Кілька відповідей',
  MATCHING: 'Відповідність',
  CHRONOLOGY: 'Хронологія',
}

function QuestionStats({ testId }) {
  const { data: stats, error } = useAsyncData(() => testService.getStats(testId), testId)

  if (error) return null
  if (!stats) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
        <BarChart3 className="h-4 w-4 text-blue-700" aria-hidden="true" />
        Статистика по питаннях
      </h2>
      {stats.questions.length === 0 ? (
        <p className="text-sm text-slate-500">Тест ще ніхто не проходив.</p>
      ) : (
        <>
          <p className="mb-4 text-xs text-slate-500">Спроб: {stats.attempts}. Спочатку найскладніші питання.</p>
          <ul className="space-y-3">
            {stats.questions.map((q) => (
              <li key={q.questionId}>
                <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-slate-800">{q.questionText}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                    помилок: {q.wrong} з {q.answered}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${q.correctPercent < 40 ? 'bg-red-500' : q.correctPercent < 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${q.correctPercent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700">{q.correctPercent}%</span>
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Параметри тесту</h2>
          <button
            type="button"
            onClick={() => setToDelete({ kind: 'test' })}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Видалити тест
          </button>
        </div>
        <TestForm key={`${test.id}-${test.title}-${test.timeLimitMinutes}-${test.description}`} initial={test} onSaved={refreshQuestions} />
      </section>

      <QuestionStats testId={testId} />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Питання ({test.questions.length})</h2>
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
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            У цьому тесті ще немає питань.
          </p>
        )}

        <ol className="space-y-3">
          {test.questions.map((question, index) =>
            editing === question.id ? (
              <li key={question.id}>
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
              <li key={question.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{question.questionText}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{TYPE_LABELS[question.questionType]}</span>
                    <span>Варіантів: {question.options.length}</span>
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
                    onClick={() => setToDelete({ kind: 'question', id: question.id })}
                    className={`${secondaryButtonClass} !px-2.5 !py-2 hover:!border-red-200 hover:!bg-red-50 hover:!text-red-600`}
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
    </div>
  )
}
