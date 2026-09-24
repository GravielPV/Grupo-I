import { Link } from "react-router-dom";

import StockBadge from "./StockBadge";
import ExpirationBadge from "./ExpirationBadge";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function ProductTable({ products, onDelete, canManage }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-5 py-4">Producto</th>
              <th className="px-5 py-4">Categoría</th>
              <th className="px-5 py-4">Precio</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Vencimiento</th>
              {canManage && <th className="px-5 py-4 text-right">Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 6 : 5}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {product.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {product.category}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {formatCurrency(product.price)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">
                        {product.stock}
                      </span>

                      <StockBadge stock={product.stock} />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">
                        {formatDate(product.expirationDate)}
                      </span>

                      <ExpirationBadge
                        expirationDate={product.expirationDate}
                      />
                    </div>
                  </td>

                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/products/edit/${product.id}`}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Editar
                        </Link>

                        <button
                          onClick={() => onDelete(product)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
