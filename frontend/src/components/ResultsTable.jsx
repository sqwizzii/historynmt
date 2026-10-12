import { Link } from 'react-router-dom'
import { formatDate } from '../utils/format.js'

export default function ResultsTable({ results, showStudent = false }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {showStudent && <th className="px-4 py-3">Учень</th>}
            <th className="px-4 py-3">Тест</th>
            <th className="px-4 py-3">Первинний бал</th>
            <th className="px-4 py-3" title="Орієнтовний бал за лінійною шкалою, не офіційна таблиця НМТ">Орієнт. бал НМТ</th>
            <th className="px-4 py-3">Дата</th>
            <th className="px-4 py-3">Примітки</th>
            <th className="px-4 py-3"><span className="sr-only">Розбір</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              {showStudent && <td className="px-4 py-3 font-medium text-slate-900">{r.studentName}</td>}
              <td className="px-4 py-3 text-slate-700">{r.testTitle}</td>
              <td className="px-4 py-3 tabular-nums text-slate-700">{r.score}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-blue-700">{r.nmtScore}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(r.completedAt)}</td>
              <td className="px-4 py-3 text-xs">
                <div className="flex flex-wrap gap-1">
                  {r.leaveCount > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">виходів: {r.leaveCount}</span>}
                  {r.endReason === 'LEFT_PAGE' && <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">покинув сторінку</span>}
                  {r.endReason === 'TIMEOUT' && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">час вичерпано</span>}
                  {r.late && <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">прострочено</span>}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link to={`/results/${r.id}`} className="font-medium text-blue-700 hover:underline">
                  Розбір
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
