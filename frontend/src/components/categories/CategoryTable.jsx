import Button from "../common/Button"

export default function CategoryTable({
  categories,
  onDelete
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
              Categoría
            </th>

            <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500">
              Acción
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {categories.map((category) => (
            <tr
              key={category.id}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 font-medium text-gray-900">
                {category.name}
              </td>

              <td className="px-6 py-4 text-right">
                <Button
                  variant="danger"
                  onClick={() => onDelete(category)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}