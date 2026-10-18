import { Check, Copy, FileDown, KeyRound, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import ErrorAlert from '../ErrorAlert.jsx'
import Modal from '../Modal.jsx'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import Stagger from '../motion/Stagger.jsx'
import TopicProgress from '../TopicProgress.jsx'
import ResultsTable from '../ResultsTable.jsx'
import { inputClass, listRowActiveClass, listRowIdleClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, resultService, testService, userService } from '../../services/api.js'

function StudentList({ selectedId, onSelect, version }) {
  const { data: students, error, reload } = useAsyncData(resultService.getStudents, version, { keepPrevious: true })
  const [query, setQuery] = useState('')

  if (error && !students) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!students) return <LoadingState />

  const needle = query.trim().toLowerCase()
  const visible = students.filter((s) => `${s.fullName} ${s.username}`.toLowerCase().includes(needle))
  const itemClass = (active) =>
    `flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left text-[0.8125rem] transition-colors ${
      active ? listRowActiveClass : listRowIdleClass
    }`

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-card sm:p-4">
      <div className="relative mb-2.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-mute-soft)]" aria-hidden="true" />
        <input className={`${inputClass} !py-2 pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук учня" aria-label="Пошук учня" />
      </div>
      <Stagger as="ul" immediate step={40} className="max-h-[28rem] space-y-0.5 overflow-y-auto">
        <li>
          <button type="button" onClick={() => onSelect(null)} className={itemClass(selectedId === null)}>
            <span className="flex items-center gap-2 font-semibold">
              <Users className="h-3.5 w-3.5 text-[var(--color-mute)]" aria-hidden="true" />
              Усі учні
            </span>
            <span className="text-[0.6875rem] text-[var(--color-mute)]">{students.length}</span>
          </button>
        </li>
        {visible.map((student) => (
          <li key={student.id}>
            <button type="button" onClick={() => onSelect(student)} className={itemClass(selectedId === student.id)}>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{student.fullName}</span>
                <span className="block truncate text-[0.6875rem] text-[var(--color-mute)]">логін: {student.username}</span>
              </span>
              <span className="shrink-0 text-right text-[0.6875rem] text-[var(--color-mute)]">
                <span className="block">Спроб: {student.attempts}</span>
                {student.bestNmtScore != null && <span className="block font-semibold text-indigo-700">Кращий: {student.bestNmtScore}</span>}
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 && <li className="px-2 py-4 text-center text-[0.8125rem] text-[var(--color-mute)]">Учнів не знайдено</li>}
      </Stagger>
    </div>
  )
}

function ResetPasswordModal({ student, onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 6) return setError('Пароль має містити щонайменше 6 символів.')
    setError('')
    setLoading(true)
    try {
      await userService.resetStudentPassword(student.id, password)
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`Новий пароль для ${student.username}`} onClose={onClose}>
      {done ? (
        <div className="mt-3 space-y-4 text-sm text-[var(--color-mute)]">
          <p>Пароль змінено. Передайте його учневі: після входу він може змінити пароль у своєму профілі.</p>
          <button type="button" onClick={onClose} className={`${primaryButtonClass} w-full`}>
            Готово
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <ErrorAlert message={error} />
          <div>
            <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
              Новий пароль
            </label>
            <input id="reset-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" autoFocus />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="submit" disabled={loading} className={`${primaryButtonClass} flex-1`}>
              {loading ? 'Зберігаємо…' : 'Змінити пароль'}
            </button>
            <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1`}>
              Скасувати
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function ResultsPanel({ student, version }) {
  const studentId = student?.id ?? null
  const { data: results, error, reload } = useAsyncData(
    () => (studentId === null ? resultService.getAllForTeacher() : resultService.getStudentResults(studentId)),
    `${studentId ?? 'all'}:${version}`,
  )
  const pending = useAsyncData(resultService.getPending, version)
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)

  async function exportResults(format) {
    setExportError('')
    setExporting(true)
    try {
      await testService.exportResults({ format, studentId: studentId ?? undefined })
    } catch (err) {
      setExportError(getErrorMessage(err, 'Не вдалося експортувати результати.'))
    } finally {
      setExporting(false)
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!results) return <LoadingState label="Завантажуємо результати…" />
  if (results.length === 0) {
    return <EmptyState title="Результатів ще немає" text={studentId === null ? "Тут з'являться спроби учнів." : 'Цей учень ще не проходив тестів.'} />
  }
  const pendingCount = pending.data?.length ?? 0
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-[var(--color-mute)]">
          {pendingCount > 0 ? (
            <span className="font-semibold text-amber-800">Очікують перевірки: {pendingCount}</span>
          ) : (
            <span>Експорт результатів</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportResults('csv')} disabled={exporting} className={`${secondaryButtonClass} !px-3 !py-2 text-xs`}>
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
          <button type="button" onClick={() => exportResults('xlsx')} disabled={exporting} className={`${secondaryButtonClass} !px-3 !py-2 text-xs`}>
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            XLSX
          </button>
        </div>
      </div>
      {exportError && <p className="mb-3 text-xs text-red-700">{exportError}</p>}
      {studentId !== null && <TopicProgress fetcher={() => resultService.getStudentTopics(studentId)} dependency={`${studentId}:${version}`} />}
      <ResultsTable results={results} showStudent={studentId === null} />
    </>
  )
}

function InviteCodeCard() {
  const { data: code, error, reload } = useAsyncData(userService.getInviteCode)
  const [current, setCurrent] = useState(null)
  const [copied, setCopied] = useState(false)
  const [actionError, setActionError] = useState('')
  const shown = current ?? code

  async function regenerate() {
    setActionError('')
    try {
      setCurrent(await userService.regenerateInviteCode())
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setActionError('Не вдалося скопіювати. Виділіть код вручну.')
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-inverse)] p-5 text-[var(--color-on-inverse)] shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-white/45">Код запрошення</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-wide text-white">{shown ?? '…'}</p>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/50">
            Передайте учням. Після зміни коду старий перестає працювати; вже створені акаунти це не зачіпає.
          </p>
          {actionError && <p className="mt-2 text-xs text-red-300">{actionError}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!shown}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Скопійовано' : 'Копіювати'}
          </button>
          <button
            type="button"
            onClick={regenerate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Новий код
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StudentsResults() {
  const [student, setStudent] = useState(null)
  const [version, setVersion] = useState(0)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function deleteStudent() {
    setBusy(true)
    setDeleteError('')
    try {
      await userService.deleteStudent(student.id)
      setDeleting(false)
      setStudent(null)
      setVersion((v) => v + 1)
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <InviteCodeCard />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="self-start">
          <StudentList selectedId={student?.id ?? null} onSelect={setStudent} version={version} />
        </div>
        <div className="space-y-4">
          {student && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-card">
              <div className="min-w-0">
                <div className="truncate font-semibold text-[var(--color-ink)]">{student.fullName}</div>
                <div className="truncate text-xs text-[var(--color-mute)]">логін: {student.username}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setResetting(true)} className={secondaryButtonClass}>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Новий пароль
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(true)}
                  className={`${secondaryButtonClass} hover:!border-red-200 hover:!bg-red-50 hover:!text-red-600`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Видалити
                </button>
              </div>
            </div>
          )}
          <ResultsPanel student={student} version={version} />
        </div>

        {resetting && <ResetPasswordModal student={student} onClose={() => setResetting(false)} />}
        {deleting && (
          <ConfirmDialog
            title="Видалити учня?"
            message={`Акаунт ${student.username} та всі його результати буде видалено безповоротно.`}
            loading={busy}
            error={deleteError}
            onConfirm={deleteStudent}
            onCancel={() => {
              setDeleting(false)
              setDeleteError('')
            }}
          />
        )}
      </div>
    </>
  )
}
