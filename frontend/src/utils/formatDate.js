export function formatDate(date) {
  if (!date) {
    return ""
  }

  return new Intl.DateTimeFormat(
    "es-DO"
  ).format(new Date(date))
}