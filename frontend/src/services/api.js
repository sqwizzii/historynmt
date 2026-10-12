import axios from 'axios'

export const TOKEN_KEY = 'token'
export const USER_KEY = 'user'
export const AUTH_EXPIRED_EVENT = 'auth:expired'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error, fallback = 'Сталася помилка. Спробуйте ще раз.') {
  if (!error.response) {
    return 'Не вдалося зв\u2019язатися із сервером. Перевірте, чи запущено бекенд.'
  }
  const data = error.response.data
  const fieldErrors = data?.fieldErrors && Object.values(data.fieldErrors)
  if (fieldErrors?.length) {
    return fieldErrors.join('. ')
  }
  return data?.message ?? fallback
}

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
}

export const testService = {
  getAll: () => api.get('/tests').then((r) => r.data),
  getById: (testId) => api.get(`/tests/${testId}`).then((r) => r.data),
  create: (payload) => api.post('/tests/create', payload).then((r) => r.data),
  createQuestion: (payload) => api.post('/tests/questions/create', payload).then((r) => r.data),
  submit: (testId, answers) => api.post(`/tests/${testId}/submit`, { answers }).then((r) => r.data),
}

export const quizletService = {
  getModules: () => api.get('/quizlet').then((r) => r.data),
  getModule: (moduleId) => api.get(`/quizlet/${moduleId}`).then((r) => r.data),
  createModule: (payload) => api.post('/quizlet/create', payload).then((r) => r.data),
  addFlashcard: (moduleId, payload) => api.post(`/quizlet/${moduleId}/cards`, payload).then((r) => r.data),
}

export const resultService = {
  getMy: () => api.get('/results/my').then((r) => r.data),
  getAllForTeacher: () => api.get('/teacher/results').then((r) => r.data),
  getStudents: () => api.get('/teacher/students').then((r) => r.data),
  getStudentResults: (studentId) => api.get(`/teacher/students/${studentId}/results`).then((r) => r.data),
}

export default api
