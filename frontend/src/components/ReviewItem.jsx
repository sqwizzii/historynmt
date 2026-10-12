import { CheckCircle2, Lightbulb, MinusCircle, XCircle } from 'lucide-react'
import QuestionImage from './QuestionImage.jsx'

function statusOf(item) {
  if (item.earned === item.max) return { label: 'Правильно', Icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800' }
  if (item.earned === 0) return { label: 'Неправильно', Icon: XCircle, className: 'bg-red-100 text-red-800' }
  return { label: 'Частково', Icon: MinusCircle, className: 'bg-amber-100 text-amber-800' }
}

function AnswerBlock({ title, lines, emptyText, tone }) {
  return (
    <div className={`rounded-xl p-3.5 ${tone}`}>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide opacity-70">{title}</h3>
      {lines.length === 0 ? (
        <p className="text-sm italic opacity-70">{emptyText}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {lines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ReviewItem({ item, number }) {
  const status = statusOf(item)
  return (
              <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-500">Питання {number}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                    <status.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {status.label}: {item.earned} з {item.max}
                  </span>
                </div>
                <QuestionImage src={item.imageUrl} />
                <p className="mb-4 font-semibold leading-snug text-slate-900">{item.questionText}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AnswerBlock
                    title="Ваша відповідь"
                    lines={item.yourAnswer}
                    emptyText="Без відповіді"
                    tone={item.earned === item.max ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}
                  />
                  <AnswerBlock title="Правильна відповідь" lines={item.correctAnswer} emptyText="-" tone="bg-slate-50 text-slate-800" />
                </div>
                {item.explanation && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3.5 text-sm text-blue-900">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>{item.explanation}</p>
                  </div>
                )}
              </li>
  )
}
