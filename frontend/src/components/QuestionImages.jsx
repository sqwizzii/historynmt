import QuestionImage from './QuestionImage.jsx'

/** Головне зображення питання та додаткові, у збереженому порядку. */
export default function QuestionImages({ main, extra }) {
  return (
    <>
      <QuestionImage src={main} />
      {(extra ?? []).map((src, index) => (
        <QuestionImage key={`${src}-${index}`} src={src} alt={`Ілюстрація ${index + 2} до питання`} />
      ))}
    </>
  )
}
