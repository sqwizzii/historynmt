export function isAnswered(answer) {
  if (!answer) return false
  if (answer.selectedOptionIds) return answer.selectedOptionIds.length > 0
  if (answer.matches) return Object.keys(answer.matches).length > 0
  if (answer.orderedOptionIds) return answer.orderedOptionIds.length > 0
  if (answer.blankAnswers) return answer.blankAnswers.some((text) => String(text ?? '').trim())
  if (typeof answer.textAnswer === 'string') return answer.textAnswer.trim().length > 0
  return false
}
