import { getDaysUntilExpiration } from "../../utils/expiration";

export default function ExpirationBadge({ expirationDate }) {
  const daysRemaining = getDaysUntilExpiration(expirationDate);

  if (daysRemaining < 0) {
    return (
      <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
        Vencido
      </span>
    );
  }

  if (daysRemaining <= 30) {
    return (
      <span className="w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-600">
        Próximo a vencer
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
      Vigente
    </span>
  );
}
