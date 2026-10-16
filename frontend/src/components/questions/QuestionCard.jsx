import QuestionImages from '../QuestionImages.jsx'
import Chronology from './Chronology.jsx'
import Matching from './Matching.jsx'
import MultipleChoice from './MultipleChoice.jsx'
import SingleChoice from './SingleChoice.jsx'

const QUESTION_TYPES = {
  SINGLE_CHOICE: { label: 'Одна відповідь', Component: SingleChoice },
  MULTIPLE_CHOICE: { label: 'Кілька відповідей', Component: MultipleChoice },
  MATCHING: { label: 'Відповідність', Component: Matching },
  CHRONOLOGY: { label: 'Хронологія', Component: Chronology },
}

export default function QuestionCard({ question, number, total, value, onChange, locked = false, children }) {
  const type = QUESTION_TYPES[question.questionType]
  const Input = type?.Component

  return (
    <article className="rounded-xl border border-[#E2E4EC] bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-800">
          {number} / {total}
        </span>
        {type && <span className="rounded-md bg-[#F0F1F5] px-2 py-0.5 text-[#3A3C48]">{type.label}</span>}
        {locked && <span className="rounded-md bg-[#F0F1F5] px-2 py-0.5 text-[#6B6E7B]">Зафіксовано</span>}
      </div>

      <QuestionImages main={question.imageUrl} extra={question.extraImageUrls} />

      <h2 className="mb-5 text-base font-semibold leading-snug tracking-tight text-[#14151C] sm:text-lg">{question.questionText}</h2>

      {Input ? (
        <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0 disabled:opacity-80">
          <Input question={question} value={value} onChange={onChange} />
        </fieldset>
      ) : (
        <p className="text-sm text-red-700">Непідтримуваний тип питання.</p>
      )}
      {children}
    </article>
  )
}
