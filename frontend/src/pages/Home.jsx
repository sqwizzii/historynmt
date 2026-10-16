import { ArrowRight, BarChart3, BookOpen, CheckCircle2, ClipboardList, RotateCcw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from '../config/brand.js'
import { useAuth } from '../context/AuthContext.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import Dashboard from './Dashboard.jsx'
import PlanCards from '../components/PlanCards.jsx'

const FEATURES = [
  {
    Icon: ClipboardList,
    title: 'Тести без ручної перевірки',
    text: 'Чотири типи завдань, таймер і автоматичний розбір — одразу після здачі.',
  },
  {
    Icon: Users,
    title: 'Учні за кодом запрошення',
    text: 'Особистий код, призначення тестів і історія спроб у одному кабінеті.',
  },
  {
    Icon: BarChart3,
    title: 'Зрозуміла статистика',
    text: 'Бали, слабкі теми й складні питання — щоб знати, що повторювати.',
  },
]

const MORE = [
  { Icon: BookOpen, title: 'Картки', text: 'Модулі з фото й перевертанням для термінів і дат.' },
  { Icon: RotateCcw, title: 'Робота над помилками', text: 'Питання з помилками повертаються, доки відповідь не стане правильною.' },
]

const STEPS = [
  ['01', 'Кабінет вчителя', 'Зареєструйтеся, створіть тести й картки зі свого предмета.'],
  ['02', 'Запрошення учнів', 'Передайте код — учні реєструються самі й одразу прив’язуються до вас.'],
  ['03', 'Результати', 'Дивіться спроби, теми й призначення без окремих таблиць Excel.'],
]

const YEAR = new Date().getFullYear()
const PLANS = [
  { plan: 'MONTHLY', name: 'Місячний', periodDays: 30 },
  { plan: 'YEARLY', name: 'Річний', periodDays: 365 },
]

function ProductPreview() {
  return (
    <div className="animate-rise relative w-full" aria-hidden="true">
      <div className="overflow-hidden rounded-t-[1.25rem] border border-white/12 bg-[#12131c]/75 shadow-dock backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-3 text-[11px] font-medium tracking-wide text-white/45">Кабінет вчителя · {BRAND_NAME}</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[12rem_1fr]">
          <div className="hidden space-y-1 border-r border-white/8 bg-black/20 p-3 md:block">
            {['Огляд', 'Тести', 'Картки', 'Учні'].map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2.5 py-2 text-[12px] ${i === 1 ? 'bg-indigo-500/35 text-white' : 'text-white/50'}`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">Активний тест</p>
                <p className="mt-1.5 text-base font-semibold text-white sm:text-lg">Контрольна · Тема 3</p>
              </div>
              <span className="rounded-md bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">18 / 20</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[90%] rounded-full bg-indigo-400" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['Учні', '24'],
                ['Спроби', '86'],
                ['Середній', '78%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/8 bg-white/[0.04] px-3.5 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Landing() {
  return (
    <>
      <section className="bg-hero relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 pb-0 pt-14 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="stagger mx-auto max-w-[42rem] text-center">
            <p className="font-display text-[3.25rem] font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[4.75rem]">
              {BRAND_NAME}
            </p>
            <h1 className="mx-auto mt-6 max-w-xl text-lg font-medium leading-snug text-indigo-100/95 sm:text-xl">
              {BRAND_TAGLINE}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55 sm:text-[15px]">
              {BRAND_DESCRIPTION}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register/teacher" className={`${primaryButtonClass} !bg-white !text-indigo-700 hover:!bg-indigo-50 px-5 py-3`}>
                Почати як вчитель <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/register" className={`${secondaryButtonClass} !border-white/15 !bg-white/8 !text-white hover:!bg-white/12 px-5 py-3`}>
                Я учень
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/40 sm:text-sm">
              Учні входять за кодом запрошення.{' '}
              <Link to="/login" className="font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline">
                Увійти
              </Link>
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-5xl sm:mt-16">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="bg-mesh border-b border-[var(--color-line)] py-16 sm:py-20" aria-labelledby="features-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <h2 id="features-title" className="max-w-md text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Менше хаосу в підготовці. Більше уваги учням.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-mute)]">
                Masterly збирає тести, картки й результати в одному робочому просторі — без зайвих сервісів і ручної звірки відповідей.
              </p>
            </div>
            <ul className="space-y-0 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
              {FEATURES.map(({ Icon, title, text }) => (
                <li key={title} className="flex gap-4 py-5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-mute)]">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 grid gap-6 border-t border-[var(--color-line)] pt-10 sm:grid-cols-2">
            {MORE.map(({ Icon, title, text }) => (
              <article key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-ink)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-[var(--color-ink)]">{title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-mute)]">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">Як працює Masterly</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map(([n, title, text]) => (
              <li key={n} className="relative">
                <span className="font-display text-4xl font-semibold text-indigo-600/90">{n}</span>
                <span className="mt-4 block text-base font-semibold text-[var(--color-ink)]">{title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-[var(--color-mute)]">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="bg-mesh py-16 sm:py-20" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 id="pricing-title" className="text-center text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
            Два плани, однакові можливості
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-[var(--color-mute)] sm:text-base">
            Різниця лише в періоді. Учням підписка не потрібна.
          </p>
          <div className="mt-10">
            <PlanCards plans={PLANS} />
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--color-mute)]">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            Підписку активує адміністратор платформи.
          </p>
        </div>
      </section>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-ink)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight">{BRAND_NAME}</p>
            <p className="mt-2 text-sm text-white/50">Для вчителів, репетиторів і онлайн-шкіл</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-white/55">
            <Link to="/subscription" className="hover:text-white">
              Тарифи
            </Link>
            <Link to="/login" className="hover:text-white">
              Увійти
            </Link>
            <Link to="/register/teacher" className="hover:text-white">
              Реєстрація
            </Link>
          </div>
        </div>
        <div className="border-t border-white/8 py-4 text-center text-xs text-white/35">
          © {YEAR} {BRAND_NAME}
        </div>
      </footer>
    </>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <Landing />
}
