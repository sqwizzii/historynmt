import {
  BarChart3, BookOpen, ClipboardList, CreditCard, Layers, LayoutDashboard, LibraryBig, LogIn, LogOut, Menu,
  RotateCcw, ShieldCheck, Tags, UserCog, UserPlus, Users, X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { subscriptionService } from '../../services/api.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import Brand from '../Brand.jsx'
import { ghostButtonClass, navActiveClass, navIdleClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'

const ROLE_LABEL = { STUDENT: 'Учень', TEACHER: 'Вчитель', ADMIN: 'Адміністратор' }

const NAV = {
  STUDENT: [
    { section: 'Навчання', items: [
      { to: '/', label: 'Огляд', Icon: LayoutDashboard, end: true },
      { to: '/tests', label: 'Мої тести', Icon: ClipboardList },
      { to: '/quizlet', label: 'Картки', Icon: BookOpen },
      { to: '/practice', label: 'Робота над помилками', Icon: RotateCcw },
      { to: '/results', label: 'Результати', Icon: BarChart3 },
    ] },
  ],
  TEACHER: [
    { section: 'Кабінет вчителя', items: [
      { to: '/', label: 'Огляд', Icon: LayoutDashboard, end: true },
      { to: '/teacher/tests', label: 'Мої тести', Icon: ClipboardList },
      { to: '/teacher/cards', label: 'Картки й модулі', Icon: Layers },
      { to: '/teacher/students', label: 'Учні та результати', Icon: Users },
    ] },
    { section: 'Бібліотека', items: [
      { to: '/tests', label: 'Усі тести', Icon: LibraryBig },
      { to: '/quizlet', label: 'Усі картки', Icon: BookOpen },
    ] },
    { section: 'Акаунт', items: [{ to: '/subscription', label: 'Підписка', Icon: CreditCard }] },
  ],
  ADMIN: [
    { section: 'Адміністрування', items: [
      { to: '/admin', label: 'Огляд платформи', Icon: LayoutDashboard, end: true },
      { to: '/admin/users', label: 'Користувачі', Icon: UserCog },
      { to: '/admin/subjects', label: 'Предмети', Icon: Tags },
    ] },
    { section: 'Системні матеріали', items: [
      { to: '/admin/tests', label: 'Системні тести', Icon: ClipboardList },
      { to: '/admin/modules', label: 'Системні модулі', Icon: Layers },
    ] },
  ],
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? navActiveClass : navIdleClass
  }`

function Sidebar({ user, onNavigate }) {
  return (
    <nav aria-label="Основна навігація" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV[user.role].map((group) => (
        <div key={group.section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#73758A]/80">{group.section}</p>
          <ul className="space-y-0.5">
            {group.items.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SubscriptionBanner() {
  const { data } = useAsyncData(subscriptionService.me)
  const location = useLocation()
  if (!data || data.active || location.pathname === '/subscription') return null
  return (
    <div role="status" className="border-b border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:px-6">
      <span className="font-medium">Підписка не активна.</span>{' '}
      Перегляд доступний, але створювати й змінювати матеріали не можна.{' '}
      <Link to="/subscription" className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950">
        Дізнатися більше
      </Link>
    </div>
  )
}

function AccountMenu({ user, onLogout }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/account"
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
        aria-label="Мій акаунт"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 ring-2 ring-white">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-[#20212B]">{user.username}</span>
          <span className="block text-xs text-[#73758A]">{ROLE_LABEL[user.role]}</span>
        </span>
      </Link>
      <button type="button" onClick={onLogout} className={`${ghostButtonClass} p-2`} aria-label="Вийти">
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#E6E8F0] bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-[#E6E8F0] px-5">
          <Brand />
        </div>
        <Sidebar user={user} />
        {user.role === 'ADMIN' && (
          <p className="m-3 flex items-center gap-2 rounded-xl bg-indigo-50/80 px-3 py-2.5 text-xs text-indigo-800">
            <ShieldCheck className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Режим адміністратора
          </p>
        )}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <button type="button" className="absolute inset-0 bg-[#20212B]/45" onClick={() => setOpen(false)} aria-label="Закрити меню" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[88%] flex-col bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-[#E6E8F0] px-5">
              <Brand onClick={() => setOpen(false)} />
              <button type="button" onClick={() => setOpen(false)} className={`${ghostButtonClass} p-2`} aria-label="Закрити">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E6E8F0] bg-white/90 px-4 backdrop-blur-md sm:px-6">
        <button type="button" onClick={() => setOpen(true)} className={`${ghostButtonClass} p-2 lg:hidden`} aria-label="Відкрити меню">
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="hidden lg:block" />
        <AccountMenu user={user} onLogout={handleLogout} />
      </header>
      {user.role === 'TEACHER' && <SubscriptionBanner />}
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

function PublicLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const fullBleed = location.pathname === '/' || location.pathname.startsWith('/login') || location.pathname.startsWith('/register')
  const links = [
    { to: '/tests', label: 'Тести' },
    { to: '/quizlet', label: 'Картки' },
    { to: '/subscription', label: 'Тарифи' },
  ]
  const navClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'text-indigo-700' : 'text-[#73758A] hover:text-[#20212B]'}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[#E6E8F0] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Основна навігація">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className={secondaryButtonClass}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Увійти
            </Link>
            <Link to="/register/teacher" className={primaryButtonClass}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Для вчителів
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`${ghostButtonClass} p-2 md:hidden`}
            aria-expanded={open}
            aria-label="Меню"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-[#E6E8F0] bg-white px-4 py-3 md:hidden">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={`${navClass({ isActive: false })} block`} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-2 pt-2" onClick={() => setOpen(false)}>
              <Link to="/login" className={secondaryButtonClass}>
                Увійти
              </Link>
              <Link to="/register/teacher" className={primaryButtonClass}>
                Для вчителів
              </Link>
              <Link to="/register" className={secondaryButtonClass}>
                Я учень
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className={fullBleed ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6'}>
        <Outlet />
      </main>
    </div>
  )
}

export default function AppLayout() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppShell /> : <PublicLayout />
}
