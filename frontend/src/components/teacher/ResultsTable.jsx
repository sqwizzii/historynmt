import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../../services/api.js'
import { formatDate } from '../../utils/format.js'

export default function ResultsTable() {
  const { data: results, error, reload } = useAsyncData(resultService.getAllForTeacher)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!results) return <LoadingState label="Завантажуємо результати…" />
  if (results.length === 0) return <EmptyState title="Результатів ще немає" text="Тут з'являться спроби учнів." />

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Учень</th>
            <th className="px-4 py-3">Тест</th>
            <th className="px-4 py-3">Первинний бал</th>
            <th className="px-4 py-3">Бал НМТ</th>
            <th className="px-4 py-3">Дата</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{r.studentUsername}</td>
              <td className="px-4 py-3 text-slate-700">{r.testTitle}</td>
              <td className="px-4 py-3 tabular-nums text-slate-700">{r.score}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-blue-700">{r.nmtScore}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(r.completedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
