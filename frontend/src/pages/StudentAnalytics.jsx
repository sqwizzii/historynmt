import { Award, ClipboardList, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/PageState.jsx'
import Stagger from '../components/motion/Stagger.jsx'
import TopicProgress from '../components/TopicProgress.jsx'
import ResultsTable from '../components/ResultsTable.jsx'
import { primaryButtonClass } from '../components/styles.js'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, resultService } from '../services/api.js'

export default function StudentAnalytics() {
  const { data: results, error, reload } = useAsyncData(resultService.getMy)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!results) return <LoadingState label="Завантажуємо результати…" />

  const scored = results.filter((r) => r.nmtScore != null)
  const best = scored.length ? Math.max(...scored.map((r) => r.nmtScore)) : '—'
  const average = scored.length ? Math.round(scored.reduce((sum, r) => sum + r.nmtScore, 0) / scored.length) : '—'

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Мої результати" description="Історія пройдених тестів. Для тестів зі шкалою НМТ показано орієнтовний бал 100–200 (це не офіційна таблиця НМТ)." />

      {results.length === 0 ? (
        <div className="flex flex-col items-center">
          <EmptyState title="Ви ще не проходили тестів" text="Пройдіть перший тест, і тут з'явиться ваша статистика." />
          <Link to="/tests" className={primaryButtonClass}>
            Перейти до тестів
          </Link>
        </div>
      ) : (
        <>
          <Stagger immediate className="mb-6 grid gap-4 sm:grid-cols-3" step={60}>
            <StatCard Icon={ClipboardList} label="Пройдено спроб" value={results.length} />
            <StatCard Icon={Award} label="Найкращий орієнт. бал" value={best} />
            <StatCard Icon={TrendingUp} label="Середній орієнт. бал" value={average} />
          </Stagger>
          <div className="animate-fade-in">
            <TopicProgress fetcher={resultService.getMyTopics} dependency={results.length} />
            <ResultsTable results={results} />
          </div>
        </>
      )}
    </div>
  )
}
