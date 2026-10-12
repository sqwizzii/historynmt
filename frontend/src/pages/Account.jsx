import { CheckCircle2, Lock } from 'lucide-react'
import { useState } from 'react'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage, userService } from '../services/api.js'

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
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Профіль</h1>
      <p className="mt-1 text-sm text-slate-600">
        Акаунт: <span className="font-semibold text-slate-800">{user.username}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-none border border-black bg-white p-6 shadow-card" noValidate>
        <h2 className="text-base font-semibold text-slate-900">Зміна пароля</h2>
        <ErrorAlert message={error} />
        {success && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Пароль змінено.
          </div>
        )}
        <FormField label="Поточний пароль" icon={Lock} type="password" name="currentPassword" autoComplete="current-password" value={form.currentPassword} onChange={handleChange} required />
        <FormField label="Новий пароль" icon={Lock} type="password" name="newPassword" autoComplete="new-password" placeholder="Щонайменше 6 символів" value={form.newPassword} onChange={handleChange} required />
        <FormField label="Підтвердіть новий пароль" icon={Lock} type="password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} required />
        <SubmitButton loading={loading}>{loading ? 'Зберігаємо…' : 'Змінити пароль'}</SubmitButton>
      </form>
    </div>
  )
}
