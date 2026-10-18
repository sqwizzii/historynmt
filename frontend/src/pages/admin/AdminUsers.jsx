import { ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ErrorAlert from '../../components/ErrorAlert.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/PageState.jsx'
import { badgeClass, cardClass, inputClass, secondaryButtonClass } from '../../components/styles.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { adminService, getErrorMessage } from '../../services/api.js'
import { formatDate } from '../../utils/format.js'

const ROLES = { STUDENT: 'Учень', TEACHER: 'Вчитель', ADMIN: 'Адміністратор' }
const PAGE_SIZE = 10

function UserRow({ item, self, onChanged, onRemove, onError }) {
  const [busy, setBusy] = useState(false)
  const [plan, setPlan] = useState('MONTHLY')

  async function run(action) {
    setBusy(true)
    onError('')
    try {
      await action()
      onChanged()
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const sub = item.subscription
  return (
    <li className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,2fr)_9rem_minmax(0,2fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--color-ink)]">
          {item.fullName}
          {self && <span className="ml-2 text-xs text-[var(--color-mute)]">(ви)</span>}
        </p>
        <p className="truncate text-sm text-[var(--color-mute)]">
          {item.username}
          {item.email ? ` · ${item.email}` : ''}
        </p>
      </div>
      <div>
        <label className="sr-only" htmlFor={`role-${item.id}`}>Роль користувача {item.username}</label>
        <select id={`role-${item.id}`} value={item.role} disabled={busy || self} onChange={(e) => run(() => adminService.changeRole(item.id, e.target.value))} className={`${inputClass} py-1.5`}>
          {Object.entries(ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="text-sm">
        {item.role === 'TEACHER' ? (
          <div className="space-y-2">
            <span className={badgeClass(sub?.active ? 'green' : 'amber')}>
              {sub?.active ? (sub.legacyFreeAccess && !sub.expiresAt ? 'Безкоштовний доступ' : `Активна до ${formatDate(sub.expiresAt)}`) : 'Без підписки'}
            </span>
            <div className="flex flex-wrap gap-2">
              <select aria-label="План підписки" value={plan} onChange={(e) => setPlan(e.target.value)} className={`${inputClass} w-auto py-1.5`}>
                <option value="MONTHLY">Місячний</option>
                <option value="YEARLY">Річний</option>
              </select>
              <button type="button" disabled={busy} onClick={() => run(() => adminService.grant(item.id, plan))} className={`${secondaryButtonClass} px-3 py-1.5`}>
                {sub?.active ? 'Продовжити' : 'Активувати'}
              </button>
              {sub?.expiresAt && sub.active && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => adminService.cancel(item.id))}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-warning-fg)] hover:bg-[var(--color-warning-soft)]"
                >
                  Скасувати
                </button>
              )}
            </div>
          </div>
        ) : (
          <span className="text-[var(--color-mute-soft)]">—</span>
        )}
      </div>
      <button
        type="button"
        disabled={busy || self}
        onClick={() => onRemove(item)}
        className="justify-self-start rounded-lg p-2 text-[var(--color-mute-soft)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)] disabled:opacity-40 md:justify-self-end"
        aria-label={`Видалити ${item.username}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}

export default function AdminUsers() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(0)
  const [actionError, setActionError] = useState('')
  const [toRemove, setToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(query); setPage(0) }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, error, reload } = useAsyncData(
    () => adminService.users({ q: debounced, role: role || undefined, page, size: PAGE_SIZE }),
    `${debounced}|${role}|${page}`,
    { keepPrevious: true },
  )

  async function confirmRemove() {
    setRemoving(true)
    setRemoveError('')
    try {
      await adminService.removeUser(toRemove.id)
      setToRemove(null)
      reload()
    } catch (err) {
      setRemoveError(getErrorMessage(err))
    } finally {
      setRemoving(false)
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  return (
    <>
      <PageHeader title="Користувачі" description="Пошук, ролі та підписки вчителів. Себе змінити чи видалити не можна, останнього адміністратора також." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-mute-soft)]" aria-hidden="true" />
          <input type="search" aria-label="Пошук користувачів" placeholder="Пошук за логіном, іменем чи прізвищем" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-9`} />
        </div>
        <select aria-label="Фільтр за роллю" value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }} className={`${inputClass} sm:w-48`}>
          <option value="">Усі ролі</option>
          {Object.entries(ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <ErrorAlert message={actionError} />
      {error && !data ? <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        : !data ? <LoadingState />
        : data.items.length === 0 ? <EmptyState title="Нікого не знайдено" text="Змініть пошуковий запит або фільтр." />
        : (
          <section className={`${cardClass} mt-2 overflow-hidden`}>
            <ul className="divide-y divide-[var(--color-line-soft)]">
              {data.items.map((item) => (
                <UserRow key={item.id} item={item} self={item.username === user.username} onChanged={reload} onRemove={setToRemove} onError={setActionError} />
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--color-line-soft)] px-4 py-3 text-sm text-[var(--color-mute)]">
              <span>Усього: {data.total}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 0} className={`${secondaryButtonClass} px-2.5 py-1.5`} aria-label="Попередня сторінка"><ChevronLeft className="h-4 w-4" /></button>
                <span>{page + 1} / {pages}</span>
                <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= pages} className={`${secondaryButtonClass} px-2.5 py-1.5`} aria-label="Наступна сторінка"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </section>
        )}
      {toRemove && (
        <ConfirmDialog
          title="Видалити користувача?"
          message={`Акаунт «${toRemove.username}» і всі його результати буде видалено без можливості відновлення.`}
          loading={removing}
          error={removeError}
          onConfirm={confirmRemove}
          onCancel={() => { setToRemove(null); setRemoveError('') }}
        />
      )}
    </>
  )
}
