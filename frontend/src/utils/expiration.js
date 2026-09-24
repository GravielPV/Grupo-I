export function getDaysUntilExpiration(expirationDate) {
  if (!expirationDate) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiration = new Date(expirationDate)
  expiration.setHours(0, 0, 0, 0)

  const difference =
    expiration.getTime() - today.getTime()

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  )
}