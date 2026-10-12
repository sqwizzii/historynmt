import { ArrowRight, BookOpen, ClipboardList, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { user, isAuthenticated, isTeacher } = useAuth()

  const cards = [
    {
      to: '/tests',
      title: 'Тести',
      text: 'Тестові завдання у форматі НМТ: вибір відповіді, відповідність, хронологія. Результат у шкалі 100-200.',
      Icon: ClipboardList,
    },
    {
      to: '/quizlet',
      title: 'Картки',
      text: 'Модулі з картками для запам\u2019ятовування термінів, персоналій та ключових дат.',
      Icon: BookOpen,
    },
    ...(isTeacher
      ? [{ to: '/teacher', title: 'Панель вчителя', text: 'Створюйте тести й картки та переглядайте результати учнів.', Icon: LayoutDashboard }]
      : []),
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 px-6 py-12 text-white shadow-lg sm:px-12 sm:py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-300">Історія України</p>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {isAuthenticated ? `Вітаємо, ${user.username}!` : 'Готуйтеся до НМТ з історії системно'}
        </h1>
        <p className="mt-4 max-w-xl text-blue-100">
          Проходьте тести, повторюйте дати й терміни за допомогою карток та відстежуйте свій прогрес.
        </p>
        {!isAuthenticated && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-300"
            >
              Розпочати
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Увійти
            </Link>
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, title, text, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              {title}
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
