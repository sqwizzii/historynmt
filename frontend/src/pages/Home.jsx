import { ArrowRight, CheckCircle2, ClipboardList, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../config/brand.js'
import { useAuth } from '../context/AuthContext.jsx'
import Reveal from '../components/motion/Reveal.jsx'
import Stagger from '../components/motion/Stagger.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import Dashboard from './Dashboard.jsx'
import PlanCards from '../components/PlanCards.jsx'

const YEAR = new Date().getFullYear()
const PLANS = [
  { plan: 'MONTHLY', name: 'Місячний', periodDays: 30 },
  { plan: 'YEARLY', name: 'Річний', periodDays: 365 },
]

const WORKFLOWS = [
  {
    title: 'Зібрати тест за вечір',
    text: 'Додайте питання з одним або кількома варіантами, відповідністю чи хронологією. За потреби імпортуйте з Google Forms і задайте таймер.',
  },
  {
    title: 'Запросити учнів без окремих акаунтів у Excel',
    text: 'Передайте код запрошення. Учні реєструються самі, з’являються у вашому списку й отримують призначення тестів.',
  },
  {
    title: 'Побачити, де саме плутаються',
    text: 'Після здачі — автоматичний розбір. У кабінеті видно спроби, слабкі теми й питання, які варто повторити.',
  },
]

const DEMO_TESTS = [
  { title: 'Контрольна · Тема 3', meta: '20 питань · 40 хв', status: 'Призначено' },
  { title: 'Самостійна робота', meta: '12 питань · 25 хв', status: 'Чернетка' },
  { title: 'Підсумковий тест за модуль', meta: '30 питань · 55 хв', status: 'Призначено' },
]

function ProductPreview() {
  return (
    <div className="landing-preview hero-preview-enter overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-lift">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-[#d0d3dc]" />
          <span className="h-2 w-2 rounded-full bg-[#d0d3dc]" />
          <span className="h-2 w-2 rounded-full bg-[#d0d3dc]" />
        </div>
        <p className="text-[0.6875rem] font-medium text-[var(--color-mute)]">Кабінет вчителя · Тести</p>
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="grid md:grid-cols-[11.5rem_1fr]">
        <aside className="hidden border-r border-[var(--color-line)] bg-[var(--color-ink)] p-3 md:block" aria-hidden="true">
          <p className="mb-3 px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-white/35">Робота</p>
          <ul className="space-y-0.5">
            {['Огляд', 'Тести', 'Картки', 'Учні'].map((item, i) => (
              <li
                key={item}
                className={`rounded-lg px-2.5 py-2 text-[0.8125rem] ${
                  i === 1 ? 'bg-white/10 font-medium text-white' : 'text-white/50'
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[1.125rem] font-semibold tracking-tight text-[var(--color-ink)]">Тести</h3>
              <p className="mt-1 text-[0.8125rem] text-[var(--color-mute)]">Створення, призначення й перегляд результатів</p>
            </div>
            <span className="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-[0.75rem] font-semibold text-white sm:inline">
              Новий тест
            </span>
          </div>
          <ul className="divide-y divide-[var(--color-line)] overflow-hidden rounded-lg border border-[var(--color-line)]">
            {DEMO_TESTS.map((test) => (
              <li key={test.title} className="flex items-start gap-3 px-3.5 py-3.5 sm:items-center sm:px-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink)] text-white sm:mt-0">
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] font-semibold text-[var(--color-ink)]">{test.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-[var(--color-mute)]">
                    <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {test.meta}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold ${
                    test.status === 'Чернетка'
                      ? 'bg-[var(--color-surface-muted)] text-[var(--color-mute)]'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {test.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ResultSnippet() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-card">
      <div className="border-b border-[var(--color-line)] px-5 py-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-indigo-600">Результат спроби</p>
        <p className="mt-1.5 text-[1.0625rem] font-semibold tracking-tight text-[var(--color-ink)]">
          Контрольна · Тема 3
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[var(--color-line)] border-b border-[var(--color-line)]">
        {[
          ['Бал', '16 / 20'],
          ['Час', '28 хв'],
          ['Спроба', '2'],
        ].map(([label, value]) => (
          <div key={label} className="px-4 py-3.5 text-center sm:px-5">
            <p className="text-[0.6875rem] font-medium text-[var(--color-mute)]">{label}</p>
            <p className="mt-1 text-[0.9375rem] font-semibold tabular-nums text-[var(--color-ink)]">{value}</p>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-[var(--color-line-soft)] px-2 py-1">
        {[
          ['Правильно', 'Визначте дату події', true],
          ['Потребує уваги', 'Установіть відповідність', false],
          ['Правильно', 'Розташуйте події за хронологією', true],
        ].map(([tone, title, ok]) => (
          <li key={title} className="flex items-center gap-3 px-3 py-3">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-medium text-[var(--color-mute)]">{tone}</p>
              <p className="truncate text-[0.875rem] text-[var(--color-ink)]">{title}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Landing() {
  return (
    <div className="landing-page bg-[var(--color-canvas)]">
      <section className="landing-hero border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="hero-enter max-w-3xl">
            <p className="font-display text-[3rem] font-semibold leading-[0.92] tracking-tight text-[var(--color-ink)] sm:text-6xl lg:text-[4.5rem]">
              {BRAND_NAME}
            </p>
            <h1 className="mt-6 max-w-2xl text-[1.5rem] font-semibold leading-snug tracking-tight text-[var(--color-ink)] sm:text-[1.85rem] sm:leading-[1.25]">
              Кабінет для тестів, учнів і результатів — без ручної перевірки зошитів
            </h1>
            <p className="mt-4 max-w-xl text-[0.9875rem] leading-relaxed text-[var(--color-mute)] sm:text-[1.0625rem]">
              Для вчителів, репетиторів і освітніх команд. Створюйте тести, запрошуйте учнів за кодом і дивіться
              розбір відповідей в одному місці.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register/teacher" className={`${primaryButtonClass} px-5 py-3`}>
                Створити кабінет вчителя
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/login" className={`${secondaryButtonClass} px-5 py-3`}>
                Увійти
              </Link>
            </div>
            <p className="mt-4 text-[0.8125rem] text-[var(--color-mute)]">
              Учень?{' '}
              <Link to="/register" className="font-semibold text-indigo-700 underline-offset-2 transition hover:underline">
                Реєстрація за кодом запрошення
              </Link>
            </p>
          </div>

          <div className="mt-12 sm:mt-14 lg:mt-16">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-white py-16 sm:py-20" aria-labelledby="value-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <h2 id="value-title" className="max-w-md text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                Менше таблиць і месенджерів. Більше зрозумілої роботи з класом.
              </h2>
              <p className="mt-4 max-w-md text-[0.9875rem] leading-relaxed text-[var(--color-mute)]">
                Masterly зібраний навколо щоденних задач вчителя: підготувати перевірку, роздати її учням і швидко
                побачити, хто що зрозумів.
              </p>
            </Reveal>
            <Stagger as="ol" className="space-y-0 border-t border-[var(--color-line)]" step={90}>
              {WORKFLOWS.map((item, index) => (
                <li key={item.title} className="grid gap-2 border-b border-[var(--color-line)] py-6 sm:grid-cols-[6.5rem_1fr] sm:gap-6">
                  <span className="font-display text-2xl font-semibold text-indigo-600/80">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold tracking-tight text-[var(--color-ink)]">{item.title}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--color-mute)]">{item.text}</p>
                  </div>
                </li>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-canvas)] py-16 sm:py-20" aria-labelledby="product-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <h2 id="product-title" className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                Результат одразу після здачі
              </h2>
              <p className="mt-4 max-w-md text-[0.9875rem] leading-relaxed text-[var(--color-mute)]">
                Учень бачить бал і розбір. Ви — історію спроб і питання, на яких найчастіше помиляються. Без окремої
                звірки відповідей у зошитах.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Чотири типи завдань у тестах',
                  'Картки з модулів для повторення',
                  'Робота над помилками з попередніх спроб',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[0.9375rem] text-[var(--color-ink)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal variant="scale" delay={80}>
              <ResultSnippet />
            </Reveal>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-[var(--color-line)] bg-white py-16 sm:py-20" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="max-w-xl">
              <h2 id="pricing-title" className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                Два плани, однакові можливості
              </h2>
              <p className="mt-3 text-[0.9875rem] leading-relaxed text-[var(--color-mute)]">
                Різниця лише в періоді дії. Учням підписка не потрібна — вони користуються за запрошенням вчителя.
              </p>
            </div>
          </Reveal>
          <div className="mt-10">
            <PlanCards plans={PLANS} />
          </div>
          <p className="mt-6 text-[0.875rem] text-[var(--color-mute)]">
            Підписку активує адміністратор платформи. Онлайн-оплата поки не підключена.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-canvas)] py-16 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:flex-row sm:items-center sm:px-6">
          <Reveal>
            <h2 className="max-w-lg text-[1.5rem] font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">
              Готові зібрати перший тест у своєму кабінеті?
            </h2>
            <p className="mt-2 text-[0.9375rem] text-[var(--color-mute)]">Реєстрація вчителя займає кілька хвилин.</p>
          </Reveal>
          <div className="flex flex-wrap gap-3">
            <Link to="/register/teacher" className={`${primaryButtonClass} px-5 py-3`}>
              Почати як вчитель
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/subscription" className={`${secondaryButtonClass} px-5 py-3`}>
              Дивитись тарифи
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{BRAND_NAME}</p>
            <p className="mt-2 max-w-sm text-[0.875rem] text-[var(--color-mute)]">
              Освітня платформа для вчителів, репетиторів і онлайн-шкіл.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[0.875rem] text-[var(--color-mute)]" aria-label="Футер">
            <Link to="/subscription" className="transition hover:text-[var(--color-ink)]">
              Тарифи
            </Link>
            <Link to="/login" className="transition hover:text-[var(--color-ink)]">
              Увійти
            </Link>
            <Link to="/register/teacher" className="transition hover:text-[var(--color-ink)]">
              Реєстрація вчителя
            </Link>
            <Link to="/register" className="transition hover:text-[var(--color-ink)]">
              Реєстрація учня
            </Link>
          </nav>
        </div>
        <div className="border-t border-[var(--color-line)] py-4 text-center text-[0.75rem] text-[var(--color-mute-soft)]">
          © {YEAR} {BRAND_NAME}
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <Landing />
}
