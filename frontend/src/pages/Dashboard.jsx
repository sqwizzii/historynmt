import { ArrowRight, BarChart3, BookOpen, ClipboardList, CreditCard, GraduationCap, Layers, Tags, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import StatCard from '../components/StatCard.jsx'
import { badgeClass, cardClass, cardInteractiveClass, primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { adminService, getErrorMessage, resultService, subscriptionService, testService } from '../services/api.js'
import { formatDate } from '../utils/format.js'

function QuickLink({ to, title, text, Icon }) {
  return (
    <Link to={to} className={`${cardInteractiveClass} group flex items-start gap-3.5 p-4`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink)] text-white">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
          {title}
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-mute-soft)] transition group-hover:translate-x-0.5 group-hover:text-indigo-600" aria-hidden="true" />
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-mute)]">{text}</span>
      </span>
    </Link>
  )
}

function ResultsList({ results, showStudent }) {
  if (results.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-[var(--color-mute)]">Результатів поки немає.</p>
  }
  return (
    <ul className="divide-y divide-[var(--color-line-soft)]">
      {results.slice(0, 5).map((r) => (
        <li key={r.id}>
          <Link to={`/results/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[var(--color-surface-muted)]">
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[var(--color-ink)]">{r.testTitle}</span>
              <span className="block text-[11px] text-[var(--color-mute)]">
                {showStudent ? `${r.studentName} · ` : ''}
                {formatDate(r.completedAt)}
              </span>
            </span>
            <span className={badgeClass('indigo')}>{r.nmtScore ?? r.score}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function StudentDashboard() {
  const results = useAsyncData(resultService.getMy)
  const tests = useAsyncData(testService.getAll)
  if (results.error) return <ErrorState message={getErrorMessage(results.error)} onRetry={results.reload} />
  if (!results.data || !tests.data) return <LoadingState />
  const best = results.data.reduce((max, r) => Math.max(max, r.nmtScore ?? 0), 0)
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Доступні тести" value={tests.data.length} Icon={ClipboardList} />
        <StatCard label="Пройдено спроб" value={results.data.length} Icon={BarChart3} />
        <StatCard label="Найкращий бал НМТ" value={best || '—'} Icon={GraduationCap} />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className={cardClass}>
          <h2 className="border-b border-[var(--color-line-soft)] px-4 py-3.5 text-[13px] font-semibold text-[var(--color-ink)]">
            Останні результати
          </h2>
          <ResultsList results={results.data} />
        </section>
        <div className="space-y-3">
          <QuickLink to="/tests" title="Мої тести" text="Призначені й системні тести." Icon={ClipboardList} />
          <QuickLink to="/practice" title="Робота над помилками" text="Повторіть складні питання." Icon={BookOpen} />
        </div>
      </div>
    </>
  )
}

function TeacherDashboard() {
  const students = useAsyncData(resultService.getStudents)
  const tests = useAsyncData(testService.getAll)
  const results = useAsyncData(resultService.getAllForTeacher)
  const sub = useAsyncData(subscriptionService.me)
  if (students.error) return <ErrorState message={getErrorMessage(students.error)} onRetry={students.reload} />
  if (!students.data || !tests.data || !results.data || !sub.data) return <LoadingState />
  const mine = tests.data.filter((t) => t.editable)
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Мої тести" value={mine.length} Icon={ClipboardList} />
        <StatCard label="Учні" value={students.data.length} Icon={Users} />
        <StatCard label="Спроби" value={results.data.length} Icon={BarChart3} />
        <StatCard
          label="Підписка"
          value={sub.data.active ? 'Активна' : 'Не активна'}
          hint={sub.data.expiresAt ? `до ${formatDate(sub.data.expiresAt)}` : undefined}
          Icon={CreditCard}
        />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className={cardClass}>
          <div className="flex items-center justify-between border-b border-[var(--color-line-soft)] px-4 py-3.5">
            <h2 className="text-[13px] font-semibold text-[var(--color-ink)]">Останні результати учнів</h2>
            <Link to="/teacher/students" className="text-[12px] font-semibold text-indigo-700 hover:underline">
              Усі
            </Link>
          </div>
          <ResultsList results={results.data} showStudent />
        </section>
        <div className="space-y-3">
          <QuickLink to="/teacher/tests" title="Створити тест" text="Питання, шкала, призначення." Icon={ClipboardList} />
          <QuickLink to="/teacher/students" title="Учні" text="Код запрошення й результати." Icon={Users} />
          <QuickLink to="/teacher/cards" title="Картки" text="Модулі для повторення." Icon={Layers} />
        </div>
      </div>
    </>
  )
}

function AdminDashboard() {
  const { data, error, reload } = useAsyncData(adminService.stats)
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!data) return <LoadingState />
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Користувачі" value={data.users} hint={`${data.admins} адмін. · ${data.teachers} вчителів · ${data.students} учнів`} Icon={Users} />
        <StatCard label="Тести" value={data.tests} hint={`${data.systemTests} системних`} Icon={ClipboardList} />
        <StatCard label="Модулі" value={data.modules} hint={`${data.systemModules} системних`} Icon={Layers} />
        <StatCard label="Предмети" value={data.subjects} Icon={Tags} />
        <StatCard label="Активні підписки" value={data.activeSubscriptions} Icon={CreditCard} />
        <StatCard label="Спроби" value={data.results} Icon={BarChart3} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <QuickLink to="/admin/users" title="Користувачі" text="Ролі та підписки." Icon={Users} />
        <QuickLink to="/admin/tests" title="Системні тести" text="Матеріали для всіх." Icon={ClipboardList} />
        <QuickLink to="/admin/subjects" title="Предмети" text="Довідник платформи." Icon={Tags} />
      </div>
    </>
  )
}

const TITLES = {
  STUDENT: ['Огляд', 'Тести, результати й прогрес.'],
  TEACHER: ['Огляд', 'Матеріали, учні та результати.'],
  ADMIN: ['Огляд платформи', 'Стан Masterly.'],
}

export default function Dashboard() {
  const { user } = useAuth()
  const [title, description] = TITLES[user.role]
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          user.role === 'TEACHER' ? (
            <Link to="/teacher/tests" className={primaryButtonClass}>
              Новий тест
            </Link>
          ) : user.role === 'STUDENT' ? (
            <Link to="/tests" className={secondaryButtonClass}>
              До тестів
            </Link>
          ) : null
        }
      />
      {user.role === 'STUDENT' && <StudentDashboard />}
      {user.role === 'TEACHER' && <TeacherDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </>
  )
}
