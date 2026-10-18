import { Link } from 'react-router-dom'
import { formatDate } from '../utils/format.js'
import { badgeClass, tableWrapClass } from './styles.js'

export default function ResultsTable({ results, showStudent = false }) {
  return (
    <div className={tableWrapClass}>
      <table className="min-w-full divide-y divide-[var(--color-line-soft)] text-sm">
        <thead className="bg-[var(--color-surface-muted)] text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
          <tr>
            {showStudent && <th className="px-4 py-3">Учень</th>}
            <th className="px-4 py-3">Тест</th>
            <th className="px-4 py-3">Первинний</th>
            <th className="px-4 py-3" title="Орієнтовний бал за лінійною шкалою, не офіційна таблиця НМТ">
              НМТ
            </th>
            <th className="px-4 py-3">Дата</th>
            <th className="px-4 py-3">Примітки</th>
            <th className="px-4 py-3">
              <span className="sr-only">Розбір</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-line-soft)]">
          {results.map((r) => (
            <tr key={r.id} className="transition-colors duration-150 hover:bg-[var(--color-surface-muted)]">
              {showStudent && <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{r.studentName}</td>}
              <td className="px-4 py-3 text-[var(--color-ink-soft)]">{r.testTitle}</td>
              <td className="px-4 py-3 tabular-nums text-[var(--color-ink-soft)]">{r.score}</td>
              <td className="px-4 py-3 font-semibold tabular-nums text-[var(--color-accent-fg)]">{r.nmtScore ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[var(--color-mute)]">{formatDate(r.completedAt)}</td>
              <td className="px-4 py-3 text-xs">
                <div className="flex flex-wrap gap-1">
                  {(r.gradingStatus === 'PENDING_REVIEW' || (r.pendingManualCount ?? 0) > 0) && (
                    <span className={badgeClass('amber')}>
                      на перевірці{r.pendingManualCount ? `: ${r.pendingManualCount}` : ''}
                    </span>
                  )}
                  {r.leaveCount > 0 && <span className={badgeClass('amber')}>виходів: {r.leaveCount}</span>}
                  {r.endReason === 'LEFT_PAGE' && <span className={badgeClass('red')}>покинув сторінку</span>}
                  {r.endReason === 'TIMEOUT' && <span className={badgeClass('slate')}>час вичерпано</span>}
                  {r.late && <span className={badgeClass('red')}>прострочено</span>}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link to={`/results/${r.id}`} className="text-[0.8125rem] font-semibold text-[var(--color-accent-fg)] hover:underline">
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
