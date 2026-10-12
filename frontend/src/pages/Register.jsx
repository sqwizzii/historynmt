import { GraduationCap, Lock, Mail, Presentation, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authService, getErrorMessage } from '../services/api.js'

const ROLES = [
  { value: 'STUDENT', label: 'Учень', description: 'Проходжу тести та вчу картки', Icon: GraduationCap },
  { value: 'TEACHER', label: 'Вчитель', description: 'Створюю тести та картки', Icon: Presentation },
]

function validate({ username, email, password, confirmPassword }) {
  if (username.trim().length < 3 || username.trim().length > 50) {
    return 'Username має містити від 3 до 50 символів.'
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return 'Вкажіть коректну електронну адресу.'
  }
  if (password.length < 6) {
    return 'Пароль має містити щонайменше 6 символів.'
  }
  if (password !== confirmPassword) {
    return 'Паролі не збігаються.'
  }
  return ''
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'STUDENT' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authService.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })
      login(data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Створіть акаунт"
      subtitle="Тести та картки для підготовки до НМТ з історії України."
      footer={
        <>
          Вже зареєстровані?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:underline">
            Увійти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <ErrorAlert message={error} />

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-slate-700">Я реєструюсь як</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, label, description, Icon }) => {
              const selected = form.role === value
              return (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600/40 ${
                    selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={selected}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Icon className={`mb-2 h-5 w-5 ${selected ? 'text-blue-700' : 'text-slate-500'}`} aria-hidden="true" />
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <FormField
          label="Username"
          icon={User}
          name="username"
          autoComplete="username"
          placeholder="Наприклад, history_fan"
          value={form.username}
          onChange={handleChange}
          required
        />
        <FormField
          label="Електронна пошта"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <FormField
          label="Пароль"
          icon={Lock}
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Щонайменше 6 символів"
          value={form.password}
          onChange={handleChange}
          required
        />
        <FormField
          label="Підтвердіть пароль"
          icon={Lock}
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Повторіть пароль"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <SubmitButton loading={loading}>{loading ? 'Створюємо акаунт…' : 'Зареєструватися'}</SubmitButton>
      </form>
    </AuthCard>
  )
}
