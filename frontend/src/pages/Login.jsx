import { Lock, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authService, getErrorMessage } from '../services/api.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname ?? '/'

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.login({ username: form.username.trim(), password: form.password })
      login(data)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.status === 401 ? 'Невірний логін або пароль.' : getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="З поверненням!"
      subtitle="Увійдіть, щоб продовжити підготовку до НМТ з історії."
      footer={
        <>
          Ще немає акаунта?{' '}
          <Link to="/register" className="font-semibold text-blue-700 hover:underline">
            Зареєструватися
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <ErrorAlert message={error} />
        <FormField
          label="Логін"
          icon={User}
          name="username"
          autoComplete="username"
          placeholder="Ваш username"
          value={form.username}
          onChange={handleChange}
          required
          autoFocus
        />
        <FormField
          label="Пароль"
          icon={Lock}
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Ваш пароль"
          value={form.password}
          onChange={handleChange}
          required
        />
        <SubmitButton loading={loading}>{loading ? 'Входимо…' : 'Увійти'}</SubmitButton>
      </form>
    </AuthCard>
  )
}
