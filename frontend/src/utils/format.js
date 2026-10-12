export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })
}

export function pluralize(count, one, few, many) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
