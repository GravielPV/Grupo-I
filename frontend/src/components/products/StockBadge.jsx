export default function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
        Agotado
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-600">
        Stock bajo
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
      Disponible
    </span>
  );
}
