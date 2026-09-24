export function formatDate(date) {
  if (!date) return "";

  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
