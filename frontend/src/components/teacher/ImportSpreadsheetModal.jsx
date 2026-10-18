import { AlertTriangle, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import Modal from '../Modal.jsx'
import { badgeClass, primaryButtonClass, secondaryButtonClass, tableWrapClass } from '../styles.js'
import { getErrorMessage, testService } from '../../services/api.js'

const TYPE_LABELS = {
  SINGLE_CHOICE: 'Одна відповідь',
  MULTIPLE_CHOICE: 'Кілька відповідей',
  MATCHING: 'Відповідність',
  CHRONOLOGY: 'Хронологія',
  FILL_BLANK: 'Пропуски',
  OPEN: 'Відкрита',
}

export default function ImportSpreadsheetModal({ testId, testTitle, onClose, onImported }) {
  const fileInput = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [templateError, setTemplateError] = useState('')

  async function downloadTemplate() {
    setTemplateError('')
    try {
      await testService.downloadSpreadsheetTemplate()
    } catch (err) {
      setTemplateError(getErrorMessage(err, 'Не вдалося завантажити шаблон.'))
    }
  }

  async function runPreview(selected) {
    if (!selected) return
    setError('')
    setLoading(true)
    setPreview(null)
    try {
      const data = await testService.previewSpreadsheet(testId, selected)
      setFile(selected)
      setPreview(data)
    } catch (err) {
      setError(getErrorMessage(err))
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  function onFileChange(event) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (selected) runPreview(selected)
  }

  async function confirmImport() {
    if (!file || !preview?.canImport) return
    setError('')
    setLoading(true)
    try {
      const result = await testService.importSpreadsheet(testId, file)
      onImported(result)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <Modal title="Імпорт з таблиці" onClose={loading ? undefined : onClose} wide>
      <div className="mt-4 space-y-4">
        <p className="text-sm text-[var(--color-mute)]">
          Питання буде додано до тесту «{testTitle}». Підтримуються CSV і XLSX.
        </p>
        <ErrorAlert message={error || templateError} />

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadTemplate} className={secondaryButtonClass}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Завантажити шаблон
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={onFileChange}
          />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={loading} className={primaryButtonClass}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {loading && !preview ? 'Аналізуємо…' : 'Обрати файл'}
          </button>
        </div>

        {file && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            {file.name}
          </p>
        )}

        {preview && (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={badgeClass('slate')}>Рядків: {preview.rowCount}</span>
              <span className={badgeClass('indigo')}>Питань: {preview.questions?.length ?? 0}</span>
              {(preview.errors?.length ?? 0) > 0 && (
                <span className={badgeClass('amber')}>Помилок: {preview.errors.length}</span>
              )}
              {preview.canImport ? (
                <span className={badgeClass('green')}>Можна імпортувати</span>
              ) : (
                <span className={badgeClass('red')}>Потрібно виправити файл</span>
              )}
            </div>

            {preview.errors?.length > 0 && (
              <ul className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                {preview.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      Рядок {err.row}: {err.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {preview.questions?.length > 0 ? (
              <div className={tableWrapClass}>
                <table className="min-w-full divide-y divide-[var(--color-line-soft)] text-sm">
                  <thead className="bg-[var(--color-surface-muted)] text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
                    <tr>
                      <th className="px-3 py-2.5">№</th>
                      <th className="px-3 py-2.5">Тип</th>
                      <th className="px-3 py-2.5">Питання</th>
                      <th className="px-3 py-2.5">Тема</th>
                      <th className="px-3 py-2.5">Варіанти</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-line-soft)]">
                    {preview.questions.map((q) => (
                      <tr key={`${q.row}-${q.questionText}`} className="align-top">
                        <td className="px-3 py-2.5 tabular-nums text-[var(--color-mute)]">{q.row}</td>
                        <td className="px-3 py-2.5">
                          <span className={badgeClass('indigo')}>{TYPE_LABELS[q.questionType] ?? q.questionType}</span>
                        </td>
                        <td className="max-w-[14rem] px-3 py-2.5 text-[var(--color-ink)] sm:max-w-xs">
                          <span className="line-clamp-3">{q.questionText}</span>
                          {q.maxPoints != null && (
                            <span className="mt-1 block text-[0.6875rem] text-[var(--color-mute)]">макс. {q.maxPoints} б.</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--color-mute)]">{q.topic || '—'}</td>
                        <td className="px-3 py-2.5 text-[0.75rem] text-[var(--color-mute)]">
                          {q.options?.length ? `${q.options.length}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-[var(--color-line)] px-4 py-6 text-center text-sm text-[var(--color-mute)]">
                Питань для імпорту немає.
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={loading} className={secondaryButtonClass}>
                Скасувати
              </button>
              <button type="button" onClick={confirmImport} disabled={loading || !preview.canImport} className={primaryButtonClass}>
                {loading ? 'Імпортуємо…' : 'Підтвердити імпорт'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
