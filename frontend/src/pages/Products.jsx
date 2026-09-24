import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import ProductFilters from "../components/products/ProductFilters";
import ProductTable from "../components/products/ProductTable";
import { getProducts, deleteProduct } from "../services/productService"



export default function Products() {
  const { user } = useAuth();

  const canManage = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("");

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
  try {
    const response = await getProducts()

    setProducts(response.data)

  } catch (error) {
    console.error(
      "Error al cargar productos:",
      error
    )

  } finally {
    setLoading(false)
  }
}

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = category === "" || product.category === category;

    return matchesSearch && matchesCategory;
  });

const handleDelete = async (id) => {

  const confirmDelete =
    window.confirm(
      "¿Deseas eliminar este producto?"
    )

  if (!confirmDelete) {
    return
  }

  try {

    await deleteProduct(id)

    setProducts((prev) =>
      prev.filter(
        (product) => product.id !== id
      )
    )

  } catch (error) {

    console.error(
      "Error al eliminar:",
      error
    )
  }
}

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>

          <p className="mt-1 text-gray-500">
            Gestiona y consulta los medicamentos.
          </p>
        </div>

        {canManage && (
          <Link
            to="/products/new"
            className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Agregar producto
          </Link>
        )}
      </div>

      <ProductFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
      />

      <ProductTable
        products={filteredProducts}
        onDelete={handleDelete}
        canManage={canManage}
        loading={loading}
      />
    </div>
  );
}
