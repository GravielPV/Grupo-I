import { PRODUCT_CATEGORIES } from "../../constants/categories";

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 md:flex-row">
      <input
        type="text"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition
         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:max-w-md"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        <option value="">Todas las categorías</option>

        {PRODUCT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
