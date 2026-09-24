export function getDaysUntilExpiration(expirationDate) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const expiration = new Date(`${expirationDate}T00:00:00`);

  const difference = expiration.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}
