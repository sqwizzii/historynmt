import { Lightbulb } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { testService } from '../services/api.js'

export const NO_EXPLANATION = 'Пояснення для цього питання поки не додано'

function Box({ children }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

/** Показує пояснення, яке вже є в матеріалах питання чи збережене в БД; сервер сам вирішує, чи можна його віддавати. */
export default function QuestionExplanation({ testId, questionId, lazy = false }) {
  const [state, setState] = useState(null)
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
      .catch(() => !cancelled && setState({ status: 'NONE' }))
    return () => {
      cancelled = true
    }
  }, [testId, questionId, visible])

  if (!visible) return <div ref={ref} className="h-8" aria-hidden="true" />
  if (!state || state.status === 'NOT_NEEDED') return null
  if (state.text) return <Box>{state.text}</Box>
  return <Box>{NO_EXPLANATION}</Box>
}
