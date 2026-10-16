import QuestionImage from '../QuestionImage.jsx'
import Chronology from './Chronology.jsx'
import Matching from './Matching.jsx'
import MultipleChoice from './MultipleChoice.jsx'
import SingleChoice from './SingleChoice.jsx'

const QUESTION_TYPES = {
  SINGLE_CHOICE: { label: 'Одна правильна відповідь', Component: SingleChoice },
  MULTIPLE_CHOICE: { label: 'Кілька правильних відповідей', Component: MultipleChoice },
  MATCHING: { label: 'Встановлення відповідності', Component: Matching },
  CHRONOLOGY: { label: 'Хронологічна послідовність', Component: Chronology },
}

export default function QuestionCard({ question, number, total, value, onChange, locked = false, children }) {
  const type = QUESTION_TYPES[question.questionType]
  const Input = type?.Component

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-xl bg-blue-100 px-2.5 py-1 text-blue-800">
          Питання {number} з {total}
        </span>
        {type && <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-slate-700">{type.label}</span>}
      </div>

      <QuestionImage src={question.imageUrl} />

      <h2 className="mb-5 text-lg font-semibold leading-snug text-slate-900">{question.questionText}</h2>

      {Input ? (
        <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
          <Input question={question} value={value} onChange={onChange} />
        </fieldset>
      ) : <p className="text-sm text-red-700">Непідтримуваний тип питання.</p>}
      {children}
    </article>
  )
}
