import { ArrowRight, BookOpen, ClipboardList, LayoutDashboard, RotateCcw, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../config/brand.js'
import { useAuth } from '../context/AuthContext.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles.js'

const FEATURES = [
  { Icon: ClipboardList, title: 'Різні типи завдань', text: 'Одна чи кілька правильних відповідей, відповідність, хронологія. Результат і розбір одразу після завершення.' },
  { Icon: RotateCcw, title: 'Робота над помилками', text: 'Сайт сам збирає питання, де ви помилилися, і повертає їх, поки ви не відповісте правильно.' },
  { Icon: BookOpen, title: 'Картки з фото', text: 'Дати, терміни, персоналії та карти для запам\u2019ятовування з 3D-перевертанням.' },
  { Icon: Timer, title: 'Реальні умови', text: 'Таймер тесту, чесний контроль сторінки й детальний розбір із поясненнями.' },
]

function HeroCard() {
  return (
    <div className="hidden border border-white/70 bg-black lg:block" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-white/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
        <span>Приклад результату</span>
        <span className="border border-white/60 px-2 py-0.5 text-white">демо</span>
      </div>
      <div className="p-6">
        <div className="flex items-end gap-3">
          <span className="font-display text-8xl font-semibold leading-none text-white">18</span>
          <span className="pb-3 text-xs uppercase tracking-[0.16em] text-slate-300">/ 20 балів</span>
        </div>
        <div className="mt-6 h-1.5 bg-white/20">
          <div className="h-full w-[90%] bg-white" />
        </div>
        <ul className="mt-6 divide-y divide-white/25 border-y border-white/25 text-sm text-white">
          {['Тема 1', 'Тема 2', 'Тема 3'].map((topic, i) => (
            <li key={topic} className="flex items-center justify-between py-3">
              <span className="uppercase tracking-[0.08em]">{topic}</span>
              <span className="font-display text-lg">{[95, 85, 70][i]}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, isAuthenticated, isTeacher } = useAuth()

  const quickLinks = [
    { to: '/tests', title: 'Тести', text: 'Перевірте себе на реальних завданнях.', Icon: ClipboardList },
    { to: '/quizlet', title: 'Картки', text: 'Повторюйте терміни й поняття.', Icon: BookOpen },
    ...(isTeacher ? [{ to: '/teacher', title: 'Панель вчителя', text: 'Тести, картки, учні й статистика.', Icon: LayoutDashboard }] : []),
    ...(isAuthenticated && !isTeacher ? [{ to: '/practice', title: 'Помилки', text: 'Виправте те, що не вийшло.', Icon: RotateCcw }] : []),
  ]

  const lightButton =
    'inline-flex items-center gap-2 border border-white bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="bg-hero ornament relative overflow-hidden border border-black px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="stagger">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">/ {BRAND_NAME}</p>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl">
              {isAuthenticated ? (
                <>
                  Вітаємо,
                  <br />
                  {user.username}
                </>
              ) : (
                <>
                  Тести й картки
                  <br />
                  для уроків.
                </>
              )}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-300">
              Створюйте тести й картки з фото, а учні проходять їх онлайн з автоматичною роботою над помилками.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/tests" className={lightButton}>
                  До тестів
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className={lightButton}>
                    Розпочати
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 underline-offset-4 transition hover:text-white hover:underline">
                    Увійти
                  </Link>
                </>
              )}
            </div>
            <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-slate-400">Учні реєструються за кодом від вчителя</p>
          </div>
          <HeroCard />
        </div>
      </section>

      <section className="stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Швидкі переходи">
        {quickLinks.map(({ to, title, text, Icon }) => (
          <Link key={to} to={to} className="group relative border border-black bg-white p-6 transition-colors hover:bg-black hover:text-white">
            <Icon className="mb-10 h-6 w-6" aria-hidden="true" />
            <h2 className="flex items-center justify-between text-3xl">
              {title}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 group-hover:text-slate-300">{text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-16">
        <div className="mb-8 flex flex-col gap-3 border-b border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-4xl sm:text-6xl">Усе для підготовки<br />в одному місці</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">/ Чому це працює</p>
        </div>
        <div className="stagger grid gap-px border border-black bg-black sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, text }, i) => (
            <div key={title} className="bg-white p-6">
              <div className="mb-8 flex items-center justify-between">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="font-display text-sm text-slate-400">0{i + 1}</span>
              </div>
              <h3 className="font-display text-xl font-semibold uppercase leading-tight text-black">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        {!isAuthenticated && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={primaryButtonClass}>Розпочати</Link>
            <Link to="/login" className={secondaryButtonClass}>Увійти</Link>
          </div>
        )}
      </section>
    </div>
  )
}
