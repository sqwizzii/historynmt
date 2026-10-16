import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { testService } from '../services/api.js'

/** Пояснення помилки від ШІ. Сервер сам вирішує, чи можна його показувати; без нього тест працює як звичайно. */
export default function AiExplanation({ testId, questionId, lazy = false }) {
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => !lazy || typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (visible) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return undefined
    let cancelled = false
    testService
      .explain(testId, questionId)
      .then((data) => !cancelled && setState(data))
      .catch(() => !cancelled && setState({ status: 'UNAVAILABLE', message: 'Пояснення тимчасово недоступне' }))
    return () => {
      cancelled = true
    }
  }, [testId, questionId, attempt, visible])

  if (!visible) return <div ref={ref} className="h-8" aria-hidden="true" />
  if (state.status === 'NOT_NEEDED' || state.status === 'NEEDS_REVIEW') return null
  if (state.status === 'loading') {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ШІ готує пояснення…
      </p>
    )
  }
  if (state.status === 'READY' || state.status === 'TEACHER') {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50 p-3.5 text-sm text-indigo-950">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
        <div>
          <p>{state.text}</p>
          {state.status === 'READY' && <p className="mt-1 text-xs text-indigo-700">Пояснення згенеровано ШІ, за потреби перевірте за підручником.</p>}
        </div>
      </div>
    )
  }
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
      {state.message ?? 'Пояснення тимчасово недоступне'}
      <button
        type="button"
        onClick={() => {
          setState({ status: 'loading' })
          setAttempt((n) => n + 1)
        }}
        className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Повторити
      </button>
    </p>
  )
}
