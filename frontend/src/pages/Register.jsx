import { KeyRound, Lock, User, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authService, getErrorMessage } from '../services/api.js'

function validate({ username, firstName, lastName, password, confirmPassword, inviteCode }) {
  if (!inviteCode.trim()) {
    return 'Введіть код запрошення від вчителя.'
  }
  if (username.trim().length < 3 || username.trim().length > 50) {
    return 'Логін має містити від 3 до 50 символів.'
  }
  if (!firstName.trim() || !lastName.trim()) {
    return "Вкажіть ім'я та прізвище."
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

  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', inviteCode: '', password: '', confirmPassword: '' })
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
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        inviteCode: form.inviteCode.trim(),
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
      title="Реєстрація учня"
      subtitle="Створіть акаунт за кодом від вашого вчителя, щоб проходити призначені тести."
      footer={
        <>
          Вже зареєстровані?{' '}
          <Link to="/login" className="font-semibold text-indigo-700 hover:underline">
            Увійти
          </Link>
          <br />
          Ви вчитель?{' '}
          <Link to="/register/teacher" className="font-semibold text-indigo-700 hover:underline">
            Створити акаунт вчителя
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <ErrorAlert message={error} />

        <FormField
          label="Код запрошення"
          icon={KeyRound}
          name="inviteCode"
          autoComplete="off"
          placeholder="Його дає вчитель"
          value={form.inviteCode}
          onChange={handleChange}
          required
        />
        <FormField
          label="Логін"
          icon={User}
          name="username"
          autoComplete="username"
          placeholder="Наприклад, history_fan"
          value={form.username}
          onChange={handleChange}
          required
        />
        <FormField
          label="Ім'я"
          icon={UserRound}
          name="firstName"
          autoComplete="given-name"
          placeholder="Наприклад, Іван"
          value={form.firstName}
          onChange={handleChange}
          required
        />
        <FormField
          label="Прізвище"
          icon={UserRound}
          name="lastName"
          autoComplete="family-name"
          placeholder="Наприклад, Петренко"
          value={form.lastName}
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
