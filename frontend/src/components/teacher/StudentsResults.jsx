import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import ResultsTable from '../ResultsTable.jsx'
import { inputClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../../services/api.js'

function StudentList({ selectedId, onSelect }) {
  const { data: students, error, reload } = useAsyncData(resultService.getStudents)
  const [query, setQuery] = useState('')

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!students) return <LoadingState />

  const needle = query.trim().toLowerCase()
  const visible = students.filter((s) => `${s.username} ${s.email}`.toLowerCase().includes(needle))
  const itemClass = (active) =>
    `flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
      active ? 'border-blue-600 bg-blue-50' : 'border-transparent hover:bg-slate-50'
    }`

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          className={`${inputClass} pl-9`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук учня"
          aria-label="Пошук учня"
        />
      </div>
      <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
        <li>
          <button type="button" onClick={() => onSelect(null)} className={itemClass(selectedId === null)}>
            <span className="flex items-center gap-2 font-medium text-slate-900">
              <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Усі учні
            </span>
            <span className="text-xs text-slate-500">{students.length}</span>
          </button>
        </li>
        {visible.map((student) => (
          <li key={student.id}>
            <button type="button" onClick={() => onSelect(student.id)} className={itemClass(selectedId === student.id)}>
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-900">{student.username}</span>
                <span className="block truncate text-xs text-slate-500">{student.email}</span>
              </span>
              <span className="shrink-0 text-right text-xs text-slate-500">
                <span className="block">Спроб: {student.attempts}</span>
                {student.bestNmtScore != null && <span className="block font-semibold text-blue-700">Кращий: {student.bestNmtScore}</span>}
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">Учнів не знайдено</li>}
      </ul>
    </div>
  )
}

function ResultsPanel({ studentId }) {
  const { data: results, error, reload } = useAsyncData(
    () => (studentId === null ? resultService.getAllForTeacher() : resultService.getStudentResults(studentId)),
    studentId ?? 'all',
  )

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!results) return <LoadingState label="Завантажуємо результати…" />
  if (results.length === 0) {
    return <EmptyState title="Результатів ще немає" text={studentId === null ? 'Тут з\'являться спроби учнів.' : 'Цей учень ще не проходив тестів.'} />
  }
  return <ResultsTable results={results} showStudent={studentId === null} />
}

export default function StudentsResults() {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="self-start">
        <StudentList selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <ResultsPanel studentId={selectedId} />
    </div>
  )
}
