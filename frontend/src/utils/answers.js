export function isAnswered(answer) {
  if (!answer) return false
  if (answer.selectedOptionIds) return answer.selectedOptionIds.length > 0
  if (answer.matches) return Object.keys(answer.matches).length > 0
  if (answer.orderedOptionIds) return answer.orderedOptionIds.length > 0
  return false
}
