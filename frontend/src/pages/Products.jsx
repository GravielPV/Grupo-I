import { useState } from "react";
import { Link } from "react-router-dom";

import ProductFilters from "../components/products/ProductFilters";
import ProductTable from "../components/products/ProductTable";

export default function Products() {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Paracetamol 500mg",
      category: "Analgésico",
      price: 120,
      stock: 50,
      expirationDate: "20/03/2027",
    },
    {
      id: 2,
      name: "Ibuprofeno 400mg",
      category: "Antiinflamatorio",
      price: 150,
      stock: 12,
      expirationDate: "10/05/2027",
    },
    {
      id: 3,
      name: "Amoxicilina 500mg",
      category: "Antibiótico",
      price: 250,
      stock: 3,
      expirationDate: "02/12/2026",
    },
    {
      id: 4,
      name: "Loratadina 10mg",
      category: "Antialérgico",
      price: 180,
      stock: 0,
      expirationDate: "15/10/2026",
    },
  ]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = category === "" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("¿Deseas eliminar este producto?");

    if (!confirmDelete) return;

    setProducts(products.filter((product) => product.id !== id));
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>

          <p className="mt-1 text-gray-500">
            Gestiona los productos y medicamentos.
          </p>
        </div>

        <Link
          to="/products/new"
          className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Agregar producto
        </Link>
      </div>

      {/* Filtros */}
      <ProductFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
      />

      {/* Tabla */}
      <ProductTable products={filteredProducts} onDelete={handleDelete} />
    </div>
  );
}
