import { Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authService, getErrorMessage } from '../services/api.js'

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

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
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
