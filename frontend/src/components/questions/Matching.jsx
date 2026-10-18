import OptionImage from '../OptionImage.jsx'
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Є', 'Ж', 'З', 'И']

export default function Matching({ question, value, onChange }) {
  const matches = value?.matches ?? {}
  const choices = question.matchChoices ?? []

  function select(optionId, matchKey) {
    const next = { ...matches }
    if (matchKey) {
      next[optionId] = matchKey
    } else {
      delete next[optionId]
    }
    onChange({ matches: next })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-semibold text-[var(--color-mute)]">Варіанти для підбору</h3>
        <ul className="space-y-2">
          {choices.map((choice, index) => (
            <li key={choice} className="flex items-start gap-3 rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-ink)]">
              <span className="font-bold text-[var(--color-accent-fg)]">{LETTERS[index]}</span>
              <span>{choice}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-[var(--color-mute)]">Встановіть відповідність</h3>
        <ul className="space-y-3">
          {question.options.map((option, index) => (
            <li key={option.id} className="rounded-xl border border-[var(--color-line)] p-3">
              <label className="block">
                <span className="mb-2 flex items-start gap-2 text-sm text-[var(--color-ink)]">
                  <span className="font-bold text-[var(--color-mute)]">{index + 1}.</span>
                  <span>
                    {option.optionText}
                    <OptionImage src={option.imageUrl} />
                  </span>
                </span>
                <select
                  value={matches[option.id] ?? ''}
                  onChange={(event) => select(option.id, event.target.value)}
                  className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Оберіть відповідь…</option>
                  {choices.map((choice, choiceIndex) => (
                    <option key={choice} value={choice}>
                      {LETTERS[choiceIndex]}. {choice}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
