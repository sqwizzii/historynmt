import { CheckCircle2, Lock } from 'lucide-react'
import { useState } from 'react'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import Reveal from '../components/motion/Reveal.jsx'
import { badgeClass, cardClass } from '../components/styles.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage, userService } from '../services/api.js'

const ROLE_LABEL = { STUDENT: 'Учень', TEACHER: 'Вчитель', ADMIN: 'Адміністратор' }

export default function Account() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccess(false)
    if (form.newPassword.length < 6) return setError('Новий пароль має містити щонайменше 6 символів.')
    if (form.newPassword !== form.confirmPassword) return setError('Паролі не збігаються.')
    setError('')
    setLoading(true)
    try {
      await userService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Профіль" description="Обліковий запис і зміна пароля." />
      <Reveal>
        <section className={`${cardClass} mb-5 flex items-center gap-4 p-5`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-ink)] text-sm font-bold text-white">
            {user.username.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-semibold text-[var(--color-ink)]">{user.username}</p>
            <p className="mt-1">
              <span className={badgeClass('indigo')}>{ROLE_LABEL[user.role] ?? user.role}</span>
            </p>
          </div>
        </section>
      </Reveal>
      <Reveal delay={80}>
      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4 p-5 sm:p-6`} noValidate>
        <h2 className="text-[0.9375rem] font-semibold text-[var(--color-ink)]">Зміна пароля</h2>
        <ErrorAlert message={error} />
        {success && (
          <div role="status" className="motion-alert flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Пароль змінено.
          </div>
        )}
        <FormField label="Поточний пароль" name="currentPassword" type="password" icon={Lock} value={form.currentPassword} onChange={handleChange} autoComplete="current-password" required />
        <FormField label="Новий пароль" name="newPassword" type="password" icon={Lock} value={form.newPassword} onChange={handleChange} autoComplete="new-password" required hint="Щонайменше 6 символів" />
        <FormField label="Повторіть новий пароль" name="confirmPassword" type="password" icon={Lock} value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
        <SubmitButton loading={loading}>{loading ? 'Зберігаємо…' : 'Змінити пароль'}</SubmitButton>
      </form>
      </Reveal>
    </div>
  )
}
