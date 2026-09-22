const products = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Analgésico",
    stock: 50,
    price: 120
  },
  {
    id: 2,
    name: "Ibuprofeno 400mg",
    category: "Antiinflamatorio",
    stock: 12,
    price: 150
  },
  {
    id: 3,
    name: "Amoxicilina 500mg",
    category: "Antibiótico",
    stock: 3,
    price: 250
  }
]

export default function RecentProducts() {
  return (
    <div className="mt-6 rounded-xl border bg-white shadow-sm">

      <div className="border-b p-5">
        <h2 className="font-semibold text-gray-800">
          Productos recientes
        </h2>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-left">

          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Precio</th>
            </tr>
          </thead>

          <tbody>

            {products.map((product) => (
              <tr
                key={product.id}
                className="border-t"
              >
                <td className="px-5 py-4 font-medium text-gray-800">
                  {product.name}
                </td>

                <td className="px-5 py-4 text-gray-500">
                  {product.category}
                </td>

                <td className="px-5 py-4 text-gray-500">
                  {product.stock}
                </td>

                <td className="px-5 py-4 text-gray-500">
                  RD$ {product.price}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}