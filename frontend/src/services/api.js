import axios from 'axios'

export const TOKEN_KEY = 'token'
export const USER_KEY = 'user'
export const AUTH_EXPIRED_EVENT = 'auth:expired'

export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api')

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // FormData: let the browser set multipart boundary (do not force JSON).
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined)
    } else if (config.headers) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }
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
  if (data instanceof Blob) {
    return fallback
  }
  const fieldErrors = data?.fieldErrors && Object.values(data.fieldErrors)
  if (fieldErrors?.length) {
    return fieldErrors.join('. ')
  }
  return data?.message ?? fallback
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function downloadGet(path, params, filename) {
  const response = await api.get(path, { params, responseType: 'blob' })
  const disposition = response.headers?.['content-disposition']
  const matched = disposition?.match(/filename="?([^";]+)"?/i)
  downloadBlob(response.data, matched?.[1] ?? filename)
}

function multipartFile(file) {
  const data = new FormData()
  data.append('file', file)
  return data
}

export const authService = {
  registerTeacher: (payload) => api.post('/auth/register-teacher', payload).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
}

export const testService = {
  getAll: (params) => api.get('/tests', { params }).then((r) => r.data),
  getById: (testId) => api.get(`/tests/${testId}`).then((r) => r.data),
  create: (payload) => api.post('/tests/create', payload).then((r) => r.data),
  createQuestion: (payload) => api.post('/tests/questions/create', payload).then((r) => r.data),
  update: (testId, payload) => api.put(`/tests/${testId}`, payload).then((r) => r.data),
  remove: (testId) => api.delete(`/tests/${testId}`),
  copy: (testId) => api.post(`/tests/${testId}/copy`).then((r) => r.data),
  copyQuestion: (testId, questionId) => api.post(`/tests/${testId}/questions/copy-from/${questionId}`).then((r) => r.data),
  getForEdit: (testId) => api.get(`/teacher/tests/${testId}`).then((r) => r.data),
  updateQuestion: (questionId, payload) => api.put(`/tests/questions/${questionId}`, payload).then((r) => r.data),
  removeQuestion: (questionId) => api.delete(`/tests/questions/${questionId}`),
  previewImport: (payload) => api.post('/teacher/import/preview', payload).then((r) => r.data),
  createImport: (payload) => api.post('/teacher/import/create', payload).then((r) => r.data),
  importGoogleForm: (payload) => api.post('/teacher/import/google-form', payload).then((r) => r.data),
  previewSpreadsheet: (testId, file) =>
    api.post(`/teacher/tests/${testId}/import/spreadsheet/preview`, multipartFile(file)).then((r) => r.data),
  importSpreadsheet: (testId, file) =>
    api.post(`/teacher/tests/${testId}/import/spreadsheet`, multipartFile(file)).then((r) => r.data),
  downloadSpreadsheetTemplate: () => downloadGet('/teacher/import/spreadsheet/template', undefined, 'masterly-questions-template.csv'),
  exportResults: (params = {}) =>
    downloadGet('/teacher/export/results', params, `masterly-results.${params.format ?? 'csv'}`),
  exportStats: (testId, format = 'csv') =>
    downloadGet(`/teacher/tests/${testId}/export/stats`, { format }, `masterly-stats-${testId}.${format}`),
  getAnalytics: (params) => api.get('/teacher/analytics', { params }).then((r) => r.data),
  getStats: (testId) => api.get(`/teacher/tests/${testId}/stats`).then((r) => r.data),
  start: (testId) => api.post(`/tests/${testId}/start`).then((r) => r.data),
  check: (testId, questionId, answer) => api.post(`/tests/${testId}/questions/${questionId}/check`, answer).then((r) => r.data),
  explain: (testId, questionId) => api.post(`/tests/${testId}/questions/${questionId}/explanation`).then((r) => r.data),
  recordLeave: (testId) => api.post(`/tests/${testId}/leave`).then((r) => r.data),
  submit: (testId, answers, endReason = 'MANUAL') => api.post(`/tests/${testId}/submit`, { answers, endReason }).then((r) => r.data),
}

export const subjectService = {
  getAll: () => api.get('/subjects').then((r) => r.data),
}

export const subscriptionService = {
  plans: () => api.get('/subscription/plans').then((r) => r.data),
  me: () => api.get('/subscription/me').then((r) => r.data),
}

export const assignmentService = {
  get: (testId) => api.get(`/teacher/tests/${testId}/assignments`).then((r) => r.data.studentIds),
  save: (testId, studentIds) => api.put(`/teacher/tests/${testId}/assignments`, { studentIds }).then((r) => r.data.studentIds),
}

export const adminService = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  changeRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  removeUser: (id) => api.delete(`/admin/users/${id}`),
  grant: (id, plan) => api.post(`/admin/users/${id}/subscription`, { plan }).then((r) => r.data),
  cancel: (id) => api.delete(`/admin/users/${id}/subscription`).then((r) => r.data),
  subjects: () => api.get('/admin/subjects').then((r) => r.data),
  createSubject: (payload) => api.post('/admin/subjects', payload).then((r) => r.data),
  updateSubject: (id, payload) => api.put(`/admin/subjects/${id}`, payload).then((r) => r.data),
  removeSubject: (id) => api.delete(`/admin/subjects/${id}`),
}

export const quizletService = {
  getModules: () => api.get('/quizlet').then((r) => r.data),
  getModule: (moduleId) => api.get(`/quizlet/${moduleId}`).then((r) => r.data),
  createModule: (payload) => api.post('/quizlet/create', payload).then((r) => r.data),
  addFlashcard: (moduleId, payload) => api.post(`/quizlet/${moduleId}/cards`, payload).then((r) => r.data),
  updateModule: (moduleId, payload) => api.put(`/quizlet/${moduleId}`, payload).then((r) => r.data),
  removeModule: (moduleId) => api.delete(`/quizlet/${moduleId}`),
  updateFlashcard: (cardId, payload) => api.put(`/quizlet/cards/${cardId}`, payload).then((r) => r.data),
  removeFlashcard: (cardId) => api.delete(`/quizlet/cards/${cardId}`),
}

export const resultService = {
  getMy: () => api.get('/results/my').then((r) => r.data),
  getMyTopics: () => api.get('/results/my/topics').then((r) => r.data),
  getStudentTopics: (studentId) => api.get(`/teacher/students/${studentId}/topics`).then((r) => r.data),
  getById: (resultId) => api.get(`/results/${resultId}`).then((r) => r.data),
  getAllForTeacher: () => api.get('/teacher/results').then((r) => r.data),
  getPending: () => api.get('/teacher/results/pending').then((r) => r.data),
  getStudents: () => api.get('/teacher/students').then((r) => r.data),
  getStudentResults: (studentId) => api.get(`/teacher/students/${studentId}/results`).then((r) => r.data),
  grade: (resultId, payload) => api.post(`/teacher/results/${resultId}/grade`, payload).then((r) => r.data),
}

export const practiceService = {
  getMistakes: () => api.get('/practice/mistakes').then((r) => r.data),
  check: (answers) => api.post('/practice/mistakes/check', { answers }).then((r) => r.data),
}

export const userService = {
  changePassword: (payload) => api.put('/account/password', payload),
  resetStudentPassword: (studentId, newPassword) => api.put(`/teacher/students/${studentId}/password`, { newPassword }),
  getInviteCode: () => api.get('/teacher/invite-code').then((r) => r.data.code),
  setInviteCode: (code) => api.put('/teacher/invite-code', { code }).then((r) => r.data.code),
  regenerateInviteCode: () => api.post('/teacher/invite-code/regenerate').then((r) => r.data.code),
  deleteStudent: (studentId) => api.delete(`/teacher/students/${studentId}`),
}

export default api
