import { CheckCircle2, Lightbulb, MinusCircle, XCircle } from 'lucide-react'
import QuestionExplanation from '../QuestionExplanation.jsx'

function statusOf(item) {
  if (item.earned === item.max) return { label: 'Правильно', Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-900' }
  if (item.earned === 0) return { label: 'Неправильно', Icon: XCircle, className: 'bg-red-50 text-red-900' }
  return { label: 'Частково правильно', Icon: MinusCircle, className: 'bg-amber-50 text-amber-900' }
}

export default function AnswerFeedback({ item, testId, children }) {
  const status = statusOf(item)
  return (
    <section aria-live="polite" className={`mt-5 rounded-xl p-4 text-sm ${status.className}`}>
      <p className="flex items-center gap-2 font-semibold">
        <status.Icon className="h-4 w-4" aria-hidden="true" />
        {status.label}: {item.earned} з {item.max}
      </p>
      {item.yourAnswer?.length > 0 && <p className="mt-2"><span className="font-medium">Ваша відповідь:</span> {item.yourAnswer.join('; ')}</p>}
      {item.correctAnswer?.length > 0 && item.earned !== item.max && (
        <p className="mt-1"><span className="font-medium">Правильна відповідь:</span> {item.correctAnswer.join('; ')}</p>
      )}
      {item.explanation && (
        <p className="mt-2 flex items-start gap-2 text-slate-800">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
          {item.explanation}
        </p>
      )}
      {testId && !item.explanation && item.earned < item.max && item.correctAnswer?.length > 0 && (
        <QuestionExplanation testId={testId} questionId={item.questionId} />
      )}
      {children}
    </section>
  )
}
