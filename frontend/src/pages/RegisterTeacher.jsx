import { AtSign, Lock, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authService, getErrorMessage } from '../services/api.js'

function validate(f) {
  if (f.username.trim().length < 3 || f.username.trim().length > 50) return 'Логін має містити від 3 до 50 символів.'
  if (!f.firstName.trim() || !f.lastName.trim()) return "Вкажіть ім'я та прізвище."
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Вкажіть коректний email або залиште поле порожнім.'
  if (f.password.length < 8) return 'Пароль має містити щонайменше 8 символів.'
  if (f.password !== f.confirmPassword) return 'Паролі не збігаються.'
  return ''
}

export default function RegisterTeacher() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validate(form)
    if (problem) return setError(problem)
    setError('')
    setLoading(true)
    try {
      const data = await authService.registerTeacher({
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        password: form.password,
      })
      login(data)
      navigate('/subscription', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Акаунт вчителя"
      subtitle="Створіть кабінет, щоб готувати тести й картки та відстежувати прогрес учнів."
      footer={<>Вже є акаунт? <Link to="/login" className="font-semibold text-indigo-700 hover:underline">Увійти</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorAlert message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Ім'я" name="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} required autoFocus />
          <FormField label="Прізвище" name="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} required />
        </div>
        <FormField label="Логін" icon={User} name="username" autoComplete="username" value={form.username} onChange={handleChange} required />
        <FormField label="Email (необов'язково)" icon={AtSign} type="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} />
        <FormField label="Пароль" icon={Lock} type="password" name="password" autoComplete="new-password" hint="Щонайменше 8 символів" value={form.password} onChange={handleChange} required />
        <FormField label="Повторіть пароль" icon={Lock} type="password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} required />
        <SubmitButton loading={loading}>{loading ? 'Створюємо…' : 'Створити акаунт'}</SubmitButton>
        <p className="text-xs text-slate-500">Доступ до створення матеріалів відкривається після активації підписки адміністратором платформи.</p>
      </form>
    </AuthCard>
  )
}
