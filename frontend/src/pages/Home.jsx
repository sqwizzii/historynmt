import { ArrowRight, BarChart3, BookOpen, CheckCircle2, ClipboardList, RotateCcw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from '../config/brand.js'
import { useAuth } from '../context/AuthContext.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles.js'
import Dashboard from './Dashboard.jsx'
import PlanCards from '../components/PlanCards.jsx'

const FEATURES = [
  { Icon: ClipboardList, title: 'Тести з автоматичною перевіркою', text: 'Чотири типи завдань, таймер, результат і розбір одразу після завершення — без ручної перевірки.' },
  { Icon: BookOpen, title: 'Картки та модулі', text: 'Терміни й поняття з фото та перевертанням, згруповані за предметами й класами.' },
  { Icon: Users, title: 'Учні та призначення', text: 'Код запрошення, призначення тестів окремим учням і повна історія спроб.' },
  { Icon: BarChart3, title: 'Статистика', text: 'Результати по учнях, темах і питаннях: видно, що саме потрібно повторити.' },
  { Icon: RotateCcw, title: 'Робота над помилками', text: 'Платформа збирає питання з помилками й повертає їх, доки учень не відповість правильно.' },
]

const STEPS = [
  ['1', 'Створіть кабінет', 'Зареєструйтеся як вчитель і додайте тести та картки зі свого предмета.'],
  ['2', 'Запросіть учнів', 'Передайте особистий код: учні реєструються самі й одразу потрапляють до вас.'],
  ['3', 'Аналізуйте результати', 'Переглядайте оцінки за шкалою тесту й слабкі теми кожного учня.'],
]

const YEAR = new Date().getFullYear()

const PLANS = [
  { plan: 'MONTHLY', name: 'Місячний', periodDays: 30 },
  { plan: 'YEARLY', name: 'Річний', periodDays: 365 },
]

function Landing() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[#E6E8F0] bg-white">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="stagger">
            <p className="mb-3 text-4xl font-semibold tracking-tight text-indigo-600 sm:text-5xl">{BRAND_NAME}</p>
            <h1 className="max-w-xl text-2xl font-semibold leading-snug tracking-tight text-[#20212B] sm:text-3xl">
              {BRAND_TAGLINE}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#73758A] sm:text-lg">{BRAND_DESCRIPTION}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register/teacher" className={`${primaryButtonClass} px-5 py-3`}>
                Я вчитель <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/register" className={`${secondaryButtonClass} px-5 py-3`}>
                Я учень
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#73758A]">
              Учні реєструються за кодом запрошення від вчителя.{' '}
              <Link to="/login" className="font-semibold text-indigo-700 hover:underline">
                Вже є акаунт?
              </Link>
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6E8F0] bg-white p-5 shadow-lift sm:p-6" aria-hidden="true">
            <div className="flex items-center justify-between border-b border-[#E6E8F0] pb-3 text-sm">
              <span className="font-semibold text-[#20212B]">Контрольна робота</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Завершено</span>
            </div>
            <div className="flex items-end gap-2 py-5">
              <span className="text-6xl font-semibold tracking-tight text-indigo-600">18</span>
              <span className="pb-2 text-sm text-[#73758A]">/ 20 балів</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[90%] rounded-full bg-indigo-600" />
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {[['Тема 1', 95], ['Тема 2', 85], ['Тема 3', 70]].map(([topic, value]) => (
                <li key={topic} className="flex items-center gap-3">
                  <span className="w-16 text-[#73758A]">{topic}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-indigo-400" style={{ width: `${value}%` }} />
                  </span>
                  <span className="w-10 text-right font-medium text-[#20212B]">{value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="features-title">
        <h2 id="features-title" className="text-center text-2xl font-semibold tracking-tight text-[#20212B] sm:text-3xl">
          Усе для роботи вчителя в одному місці
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#73758A] sm:text-base">
          Створюйте матеріали, проводьте контроль і бачте прогрес учнів — без зайвих таблиць і розрізнених сервісів.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <article key={title} className="rounded-[0.875rem] border border-[#E6E8F0] bg-white p-6 shadow-card transition hover:border-indigo-100 hover:shadow-lift">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-[#20212B]">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#73758A]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E6E8F0] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[#20212B] sm:text-3xl">Як це працює</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(([n, title, text]) => (
              <li key={n} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {n}
                </span>
                <span>
                  <span className="block font-semibold text-[#20212B]">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-[#73758A]">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-4xl px-4 py-16 sm:px-6" aria-labelledby="pricing-title">
        <h2 id="pricing-title" className="text-center text-2xl font-semibold tracking-tight text-[#20212B] sm:text-3xl">
          Два прості плани
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[#73758A]">
          Однакові можливості, різний період. Для учнів платформа безкоштовна.
        </p>
        <div className="mt-10">
          <PlanCards plans={PLANS} />
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[#73758A]">
          <CheckCircle2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Підписку активує адміністратор платформи.
        </p>
      </section>

      <footer className="border-t border-[#E6E8F0] bg-white py-8 text-center text-sm text-[#73758A]">
        © {YEAR} {BRAND_NAME}
      </footer>
    </>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <Landing />
}
