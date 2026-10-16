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
      { to: '/practice', label: 'Помилки', Icon: RotateCcw },
      { to: '/results', label: 'Результати', Icon: BarChart3 },
    ] },
  ],
  TEACHER: [
    { section: 'Робота', items: [
      { to: '/', label: 'Огляд', Icon: LayoutDashboard, end: true },
      { to: '/teacher/tests', label: 'Тести', Icon: ClipboardList },
      { to: '/teacher/cards', label: 'Картки', Icon: Layers },
      { to: '/teacher/students', label: 'Учні', Icon: Users },
    ] },
    { section: 'Бібліотека', items: [
      { to: '/tests', label: 'Усі тести', Icon: LibraryBig },
      { to: '/quizlet', label: 'Усі картки', Icon: BookOpen },
    ] },
    { section: 'Акаунт', items: [{ to: '/subscription', label: 'Підписка', Icon: CreditCard }] },
  ],
  ADMIN: [
    { section: 'Платформа', items: [
      { to: '/admin', label: 'Огляд', Icon: LayoutDashboard, end: true },
      { to: '/admin/users', label: 'Користувачі', Icon: UserCog },
      { to: '/admin/subjects', label: 'Предмети', Icon: Tags },
    ] },
    { section: 'Системне', items: [
      { to: '/admin/tests', label: 'Тести', Icon: ClipboardList },
      { to: '/admin/modules', label: 'Модулі', Icon: Layers },
    ] },
  ],
}

const linkClass = ({ isActive }) =>
  `nav-link group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium ${
    isActive ? navActiveClass : navIdleClass
  }`

function Sidebar({ user, onNavigate, dark = true }) {
  return (
    <nav aria-label="Основна навігація" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV[user.role].map((group) => (
        <div key={group.section}>
          <p className={`mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${dark ? 'text-white/35' : 'text-[var(--color-mute-soft)]'}`}>
            {group.section}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <span
                        className={`nav-link-indicator absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400 ${
                          isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
                        }`}
                        aria-hidden="true"
                      />
                      <Icon
                        className={`h-4 w-4 shrink-0 transition duration-200 ${isActive ? 'text-indigo-300' : 'opacity-70 group-hover:opacity-100'}`}
                        aria-hidden="true"
                      />
                      {label}
                    </>
                  )}
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
    <div role="status" className="border-b border-amber-200/80 bg-[#FFF8EB] px-4 py-2.5 text-[13px] text-amber-950 sm:px-6">
      <span className="font-semibold">Підписка не активна.</span>{' '}
      Перегляд доступний; створення й редагування — ні.{' '}
      <Link to="/subscription" className="font-semibold underline underline-offset-2">
        Деталі
      </Link>
    </div>
  )
}

function AccountMenu({ user, onLogout }) {
  return (
    <div className="flex items-center gap-1">
      <Link
        to="/account"
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-black/[0.04]"
        aria-label="Мій акаунт"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-[var(--color-ink)]">{user.username}</span>
          <span className="block text-[11px] text-[var(--color-mute)]">{ROLE_LABEL[user.role]}</span>
        </span>
      </Link>
      <button type="button" onClick={onLogout} className={`${ghostButtonClass} !p-2`} aria-label="Вийти">
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen lg:pl-[15.75rem]">
      <aside className="nav-rail fixed inset-y-0 left-0 z-30 hidden w-[15.75rem] flex-col lg:flex">
        <div className="flex h-14 items-center px-4">
          <Brand light />
        </div>
        <Sidebar user={user} />
        {user.role === 'ADMIN' && (
          <p className="mx-3 mb-4 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-[11px] text-white/50">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" /> Адміністратор
          </p>
        )}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <button type="button" className="motion-drawer-backdrop absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Закрити меню" />
          <div className="motion-drawer-panel nav-rail absolute inset-y-0 left-0 flex w-72 max-w-[88%] flex-col shadow-dock">
            <div className="flex h-14 items-center justify-between px-4">
              <Brand light onClick={() => setOpen(false)} />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95" aria-label="Закрити">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-canvas)_88%,white)] px-4 backdrop-blur-md sm:px-6">
        <button type="button" onClick={() => setOpen(true)} className={`${ghostButtonClass} !p-2 lg:hidden`} aria-label="Відкрити меню">
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="hidden lg:block" />
        <AccountMenu
          user={user}
          onLogout={() => {
            logout()
            navigate('/login')
          }}
        />
      </header>
      {user.role === 'TEACHER' && <SubscriptionBanner />}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

function PublicLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const fullBleed =
    location.pathname === '/' || location.pathname.startsWith('/login') || location.pathname.startsWith('/register')
  const links = [
    { to: '/tests', label: 'Тести' },
    { to: '/quizlet', label: 'Картки' },
    { to: '/subscription', label: 'Тарифи' },
  ]
  const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-[13px] font-medium transition ${isActive ? 'text-indigo-700' : 'text-[var(--color-mute)] hover:text-[var(--color-ink)]'}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)]/70 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Основна навігація">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className={`${secondaryButtonClass} !py-2`}>
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Увійти
            </Link>
            <Link to="/register/teacher" className={`${primaryButtonClass} !py-2`}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Для вчителів
            </Link>
          </div>
          <button type="button" onClick={() => setOpen((v) => !v)} className={`${ghostButtonClass} !p-2 md:hidden`} aria-expanded={open} aria-label="Меню">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-[var(--color-line)] bg-white px-4 py-3 md:hidden">
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
