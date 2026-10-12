import { ArrowRight, BookOpen, ClipboardList, LayoutDashboard, RotateCcw, ShieldCheck, Sparkles, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  { Icon: ClipboardList, title: 'Тести у форматі НМТ', text: 'Вибір відповіді, відповідність, хронологія. Орієнтовний бал за шкалою 100-200 одразу після завершення.' },
  { Icon: RotateCcw, title: 'Робота над помилками', text: 'Сайт сам збирає питання, де ви помилилися, і повертає їх, поки ви не відповісте правильно.' },
  { Icon: BookOpen, title: 'Картки з фото', text: 'Дати, терміни, персоналії та карти для запам\u2019ятовування з 3D-перевертанням.' },
  { Icon: Timer, title: 'Реальні умови', text: 'Таймер тесту, чесний контроль сторінки й детальний розбір із поясненнями.' },
]

function HeroCard() {
  return (
    <div className="relative hidden lg:block" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2rem] bg-gold/20 blur-3xl" />
      <div className="relative animate-float rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-blue-100">
          <span>Результат тесту</span>
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-emerald-200">завершено</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-display text-6xl font-bold leading-none text-white" style={{ fontFamily: 'var(--font-display)' }}>178</span>
          <span className="pb-1.5 text-sm text-blue-100">/ 200 орієнтовно</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-gold-soft to-gold" />
        </div>
        <ul className="mt-5 space-y-2.5 text-sm text-blue-50">
          {['Київська Русь', 'Козацька доба', 'УНР 1917-1921'].map((topic, i) => (
            <li key={topic} className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5">
              <span>{topic}</span>
              <span className="font-semibold text-gold-soft">{[92, 81, 64][i]}%</span>
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
    { to: '/quizlet', title: 'Картки', text: 'Повторіть дати, терміни й карти.', Icon: BookOpen },
    ...(isTeacher ? [{ to: '/teacher', title: 'Панель вчителя', text: 'Тести, картки, учні й статистика.', Icon: LayoutDashboard }] : []),
    ...(isAuthenticated && !isTeacher ? [{ to: '/practice', title: 'Помилки', text: 'Виправте те, що не вийшло.', Icon: RotateCcw }] : []),
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="bg-hero ornament relative overflow-hidden rounded-[2rem] px-6 py-14 text-white shadow-2xl shadow-blue-900/30 sm:px-12 sm:py-20">
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="stagger">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Історія України · НМТ
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              {isAuthenticated ? (
                <>
                  Вітаємо, <span className="text-gold-gradient">{user.username}</span>
                </>
              ) : (
                <>
                  Знайте історію, <span className="text-gold-gradient">складайте НМТ</span> впевнено
                </>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100/90">
              Тести, картки з фото та розумна робота над помилками для підготовки до НМТ з історії України.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/tests" className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-soft to-gold px-6 py-3 text-sm font-bold text-ink shadow-lg shadow-black/20 transition hover:-translate-y-0.5">
                  До тестів
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-soft to-gold px-6 py-3 text-sm font-bold text-ink shadow-lg shadow-black/20 transition hover:-translate-y-0.5">
                    Розпочати
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
                    Увійти
                  </Link>
                </>
              )}
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-blue-200/80">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Реєстрація за кодом від вашого вчителя
            </p>
          </div>
          <HeroCard />
        </div>
      </section>

      <section className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Швидкі переходи">
        {quickLinks.map(({ to, title, text, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lift"
          >
            <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/10 transition-transform duration-500 group-hover:scale-150" />
            <span className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-ink text-gold-soft shadow-md shadow-blue-900/25">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="relative flex items-center gap-2 text-xl font-bold text-ink">
              {title}
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700" aria-hidden="true" />
            </h2>
            <p className="relative mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Чому це працює</p>
          <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Усе для підготовки в одному місці</h2>
        </div>
        <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 backdrop-blur transition hover:bg-white hover:shadow-card">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-amber-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
