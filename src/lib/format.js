/** Turns an enum constant such as DEPENDS_ON into a label such as "Depends on". */
export function formatEnum(value) {
  if (!value) return ''
  const words = value.toLowerCase().replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
