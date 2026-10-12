import { BarChart3, BookOpen, ClipboardList, GraduationCap, Landmark, LayoutDashboard, LogIn, LogOut, Menu, Presentation, RotateCcw, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = {
  STUDENT: { label: 'Учень', Icon: GraduationCap, className: 'border border-black text-black' },
  TEACHER: { label: 'Вчитель', Icon: Presentation, className: 'bg-black text-white' },
}

function navLinkClass({ isActive }) {
  return [
    'flex items-center gap-2 border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors',
    isActive ? 'border-black bg-black text-white' : 'border-transparent text-slate-600 hover:border-black hover:text-black',
  ].join(' ')
}

export default function Header() {
  const { user, isAuthenticated, isTeacher, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/tests', label: 'Тести', Icon: ClipboardList },
    { to: '/quizlet', label: 'Картки', Icon: BookOpen },
    ...(isAuthenticated && !isTeacher
      ? [
          { to: '/practice', label: 'Помилки', Icon: RotateCcw },
          { to: '/results', label: 'Мої результати', Icon: BarChart3 },
        ]
      : []),
    ...(isTeacher ? [{ to: '/teacher', label: 'Панель вчителя', Icon: LayoutDashboard }] : []),
  ]

  const role = user ? ROLE_LABELS[user.role] : null

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" onClick={closeMenu} className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center bg-black text-white">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold uppercase tracking-wide text-black">
            НМТ / Історія
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Основна навігація">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <Link to="/account" className="text-sm font-semibold text-slate-800 hover:underline" title="Профіль і зміна пароля">
                  {user.username}
                </Link>
                {role && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${role.className}`}>
                    <role.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {role.label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 border border-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:underline"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Увійти
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Реєстрація
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="p-2 text-black hover:bg-slate-100 md:hidden"
          aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-black bg-white px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Мобільна навігація">
            {links.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} onClick={closeMenu} className={navLinkClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/account" onClick={closeMenu} className="text-sm font-semibold text-slate-800 hover:underline">
                    {user.username}
                  </Link>
                  {role && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${role.className}`}>
                      <role.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {role.label}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 border border-black px-3 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-black hover:text-white"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Вийти
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="border border-black px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-black"
                >
                  Увійти
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="bg-black px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Реєстрація
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
