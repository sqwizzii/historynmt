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
    <div className="relative mx-auto w-full max-w-5xl" aria-hidden="true">
      <div className="overflow-hidden rounded-t-2xl border border-white/15 bg-[#0F1020]/55 shadow-lift backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="ml-3 text-[11px] font-medium text-white/50">Кабінет вчителя · Masterly</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[11rem_1fr]">
          <div className="hidden space-y-1 border-r border-white/10 p-3 md:block">
            {['Огляд', 'Тести', 'Картки', 'Учні'].map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2.5 py-1.5 text-[12px] ${i === 1 ? 'bg-indigo-500/30 text-white' : 'text-white/55'}`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40">Активний тест</p>
                <p className="mt-1 text-sm font-semibold text-white sm:text-base">Контрольна · Тема 3</p>
              </div>
              <span className="rounded-md bg-emerald-400/20 px-2 py-1 text-[11px] font-semibold text-emerald-200">18 / 20</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[90%] rounded-full bg-indigo-400" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['Учні', '24'],
                ['Спроби', '86'],
                ['Середній', '78%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <p className="text-[10px] text-white/45">{label}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{value}</p>
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
        <div className="relative mx-auto max-w-6xl px-4 pb-0 pt-16 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="stagger mx-auto max-w-3xl text-center">
            <p className="font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">{BRAND_NAME}</p>
            <h1 className="mx-auto mt-5 max-w-2xl text-xl font-medium leading-snug text-indigo-100 sm:text-2xl">{BRAND_TAGLINE}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-indigo-200/90 sm:text-base">{BRAND_DESCRIPTION}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register/teacher" className={`${primaryButtonClass} !bg-white !text-indigo-700 hover:!bg-indigo-50 px-5 py-3`}>
                Почати як вчитель <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/register" className={`${secondaryButtonClass} !border-white/20 !bg-white/10 !text-white hover:!bg-white/15 px-5 py-3`}>
                Я учень
              </Link>
            </div>
            <p className="mt-4 text-xs text-indigo-200/70 sm:text-sm">
              Учні входять за кодом запрошення.{' '}
              <Link to="/login" className="font-semibold text-white underline-offset-2 hover:underline">
                Увійти
              </Link>
            </p>
          </div>
          <div className="mt-14 sm:mt-16">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="bg-mesh border-b border-[#E2E4EC] py-16 sm:py-20" aria-labelledby="features-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 id="features-title" className="text-2xl font-semibold tracking-tight text-[#14151C] sm:text-3xl">
              Менше хаосу в підготовці. Більше уваги учням.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6B6E7B] sm:text-base">
              Masterly збирає тести, картки й результати в одному робочому просторі — без зайвих сервісів і ручної звірки відповідей.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-[#E2E4EC] bg-white p-6 shadow-card">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-[#14151C]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B6E7B]">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {MORE.map(({ Icon, title, text }) => (
              <article key={title} className="flex gap-4 rounded-2xl border border-[#E2E4EC] bg-white/70 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F1F5] text-[#14151C]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-[#14151C]">{title}</h3>
                  <p className="mt-1 text-sm text-[#6B6E7B]">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#E2E4EC] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#14151C] sm:text-3xl">Як працює Masterly</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(([n, title, text]) => (
              <li key={n} className="relative border-t border-[#E2E4EC] pt-6">
                <span className="font-display text-3xl font-semibold text-indigo-600">{n}</span>
                <span className="mt-3 block text-base font-semibold text-[#14151C]">{title}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-[#6B6E7B]">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="bg-mesh py-16 sm:py-20" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 id="pricing-title" className="text-center text-2xl font-semibold tracking-tight text-[#14151C] sm:text-3xl">
            Два плани, однакові можливості
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-[#6B6E7B] sm:text-base">
            Різниця лише в періоді. Учням підписка не потрібна.
          </p>
          <div className="mt-10">
            <PlanCards plans={PLANS} />
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6B6E7B]">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            Підписку активує адміністратор платформи.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#E2E4EC] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="font-display text-2xl font-semibold text-[#14151C]">{BRAND_NAME}</p>
            <p className="mt-1 text-sm text-[#6B6E7B]">Для вчителів, репетиторів і онлайн-шкіл</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#6B6E7B]">
            <Link to="/subscription" className="hover:text-[#14151C]">
              Тарифи
            </Link>
            <Link to="/login" className="hover:text-[#14151C]">
              Увійти
            </Link>
            <Link to="/register/teacher" className="hover:text-[#14151C]">
              Реєстрація
            </Link>
          </div>
        </div>
        <div className="border-t border-[#E2E4EC] py-4 text-center text-xs text-[#8B8E9C]">
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
