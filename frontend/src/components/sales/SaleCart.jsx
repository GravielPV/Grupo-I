import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";

export default function SaleCart({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  total,
  onCompleteSale,
  saving,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShoppingCart size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Venta actual</h2>

            <p className="text-sm text-gray-500">
              {items.length} producto{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <ShoppingCart size={36} className="mx-auto mb-3 text-gray-300" />

          <p className="text-sm font-medium text-gray-600">
            La venta está vacía
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Agrega medicamentos para comenzar.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.product._id} className="p-4">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {item.product.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatCurrency(item.product.price)} c/u
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(item.product._id)}
                  className="
                    flex h-8 w-8 shrink-0 items-center
                    justify-center rounded-lg
                    text-gray-400 transition
                    hover:bg-red-50 hover:text-red-600
                  "
                  title="Quitar producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => onDecrease(item.product._id)}
                    className="p-2 text-gray-500 hover:text-gray-900"
                  >
                    <Minus size={15} />
                  </button>

                  <span className="min-w-9 text-center text-sm font-semibold text-gray-700">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => onIncrease(item.product._id)}
                    disabled={item.quantity >= item.product.stock}
                    className="
                      p-2 text-gray-500
                      hover:text-gray-900
                      disabled:cursor-not-allowed
                      disabled:text-gray-300
                    "
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium text-gray-600">Total</span>

          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onCompleteSale}
          disabled={items.length === 0 || saving}
          className="
            w-full rounded-lg bg-emerald-600
            px-4 py-3 text-sm font-semibold text-white
            transition hover:bg-emerald-700
            disabled:cursor-not-allowed
            disabled:bg-gray-300
          "
        >
          {saving ? "Procesando venta..." : "Completar venta"}
        </button>
      </div>
    </div>
  );
}
