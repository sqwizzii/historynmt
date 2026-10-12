import { BookOpen, ClipboardList, GraduationCap, Landmark, LayoutDashboard, LogIn, LogOut, Menu, Presentation, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = {
  STUDENT: { label: 'Учень', Icon: GraduationCap, className: 'bg-sky-100 text-sky-800' },
  TEACHER: { label: 'Вчитель', Icon: Presentation, className: 'bg-amber-100 text-amber-800' },
}

function navLinkClass({ isActive }) {
  return [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')
}

export default function Header() {
  const { user, isAuthenticated, isTeacher, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/tests', label: 'Тести', Icon: ClipboardList },
    { to: '/quizlet', label: 'Картки', Icon: BookOpen },
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-amber-300 shadow-sm">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            НМТ <span className="text-blue-700">Історія</span>
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
                <span className="text-sm font-semibold text-slate-800">{user.username}</span>
                {role && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${role.className}`}>
                    <role.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {role.label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Увійти
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
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
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
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
                  <span className="text-sm font-semibold text-slate-800">{user.username}</span>
                  {role && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${role.className}`}>
                      <role.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {role.label}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700"
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Увійти
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white"
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
