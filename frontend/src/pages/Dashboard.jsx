import { ArrowRight, BarChart3, BookOpen, ClipboardList, CreditCard, GraduationCap, Layers, Tags, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import StatCard from '../components/StatCard.jsx'
import { badgeClass, cardClass, primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { adminService, getErrorMessage, resultService, subscriptionService, testService } from '../services/api.js'
import { formatDate } from '../utils/format.js'

function QuickLink({ to, title, text, Icon }) {
  return (
    <Link to={to} className={`${cardClass} group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between font-semibold text-slate-900">
          {title}
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
        <span className="mt-0.5 block text-sm text-slate-600">{text}</span>
      </span>
    </Link>
  )
}

function ResultsList({ results, showStudent }) {
  if (results.length === 0) return <p className="px-5 py-8 text-center text-sm text-slate-500">Результатів поки немає.</p>
  return (
    <ul className="divide-y divide-slate-100">
      {results.slice(0, 5).map((r) => (
        <li key={r.id}>
          <Link to={`/results/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-900">{r.testTitle}</span>
              <span className="block text-xs text-slate-500">{showStudent ? `${r.studentName} · ` : ''}{formatDate(r.completedAt)}</span>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Доступні тести" value={tests.data.length} Icon={ClipboardList} />
        <StatCard label="Пройдено спроб" value={results.data.length} Icon={BarChart3} />
        <StatCard label="Найкращий бал НМТ" value={best || '—'} Icon={GraduationCap} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className={cardClass}>
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Останні результати</h2>
          <ResultsList results={results.data} />
        </section>
        <div className="space-y-4">
          <QuickLink to="/tests" title="Мої тести" text="Призначені вам і системні тести." Icon={ClipboardList} />
          <QuickLink to="/practice" title="Робота над помилками" text="Повторіть питання, де були помилки." Icon={BookOpen} />
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Мої тести" value={mine.length} Icon={ClipboardList} />
        <StatCard label="Учні" value={students.data.length} Icon={Users} />
        <StatCard label="Спроби учнів" value={results.data.length} Icon={BarChart3} />
        <StatCard label="Підписка" value={sub.data.active ? 'Активна' : 'Не активна'} hint={sub.data.expiresAt ? `до ${formatDate(sub.data.expiresAt)}` : undefined} Icon={CreditCard} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className={cardClass}>
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Останні результати учнів</h2>
          <ResultsList results={results.data} showStudent />
        </section>
        <div className="space-y-4">
          <QuickLink to="/teacher/tests" title="Створити тест" text="Питання, зображення, шкала й призначення." Icon={ClipboardList} />
          <QuickLink to="/teacher/students" title="Учні" text="Код запрошення, результати й статистика." Icon={Users} />
          <QuickLink to="/teacher/cards" title="Картки" text="Модулі для повторення матеріалу." Icon={Layers} />
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Користувачі" value={data.users} hint={`${data.admins} адмін. · ${data.teachers} вчителів · ${data.students} учнів`} Icon={Users} />
        <StatCard label="Тести" value={data.tests} hint={`${data.systemTests} системних`} Icon={ClipboardList} />
        <StatCard label="Модулі карток" value={data.modules} hint={`${data.systemModules} системних`} Icon={Layers} />
        <StatCard label="Предмети" value={data.subjects} Icon={Tags} />
        <StatCard label="Активні підписки" value={data.activeSubscriptions} Icon={CreditCard} />
        <StatCard label="Усього спроб" value={data.results} Icon={BarChart3} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickLink to="/admin/users" title="Користувачі" text="Пошук, ролі, підписки вчителів." Icon={Users} />
        <QuickLink to="/admin/tests" title="Системні тести" text="Матеріали для всіх вчителів." Icon={ClipboardList} />
        <QuickLink to="/admin/subjects" title="Предмети" text="Довідник предметів платформи." Icon={Tags} />
      </div>
    </>
  )
}

const TITLES = {
  STUDENT: ['Мій кабінет', 'Ваші тести, результати й прогрес.'],
  TEACHER: ['Кабінет вчителя', 'Огляд ваших матеріалів, учнів та результатів.'],
  ADMIN: ['Огляд платформи', 'Загальний стан платформи.'],
}

export default function Dashboard() {
  const { user } = useAuth()
  const [title, description] = TITLES[user.role]
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={user.role === 'TEACHER' ? <Link to="/teacher/tests" className={primaryButtonClass}>Новий тест</Link>
          : user.role === 'STUDENT' ? <Link to="/tests" className={secondaryButtonClass}>До тестів</Link> : null}
      />
      {user.role === 'STUDENT' && <StudentDashboard />}
      {user.role === 'TEACHER' && <TeacherDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </>
  )
}
