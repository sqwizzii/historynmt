import { Award, ClipboardList, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/PageState.jsx'
import TopicProgress from '../components/TopicProgress.jsx'
import ResultsTable from '../components/ResultsTable.jsx'
import { primaryButtonClass } from '../components/styles.js'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../services/api.js'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-none border border-black bg-white p-5 shadow-card">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </div>
  )
}

export default function StudentAnalytics() {
  const { data: results, error, reload } = useAsyncData(resultService.getMy)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!results) return <LoadingState label="Завантажуємо результати…" />

  const best = results.length ? Math.max(...results.map((r) => r.nmtScore)) : null
  const average = results.length ? Math.round(results.reduce((sum, r) => sum + r.nmtScore, 0) / results.length) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Мої результати</h1>
        <p className="mt-1 text-sm text-slate-600">Історія пройдених тестів з орієнтовними балами за лінійною шкалою 100–200 (це не офіційна таблиця НМТ).</p>
      </header>

      {results.length === 0 ? (
        <div className="flex flex-col items-center">
          <EmptyState title="Ви ще не проходили тестів" text="Пройдіть перший тест, і тут з'явиться ваша статистика." />
          <Link to="/tests" className={primaryButtonClass}>
            Перейти до тестів
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard icon={ClipboardList} label="Пройдено спроб" value={results.length} />
            <StatCard icon={Award} label="Найкращий орієнт. бал" value={best} />
            <StatCard icon={TrendingUp} label="Середній орієнт. бал" value={average} />
          </section>
          <TopicProgress fetcher={resultService.getMyTopics} dependency={results.length} />
          <ResultsTable results={results} />
        </>
      )}
    </div>
  )
}
