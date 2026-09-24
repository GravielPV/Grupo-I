import { useEffect, useState } from "react";

import StatCard from "../components/dashboard/StatCard";
import RecentProducts from "../components/dashboard/RecentProducts";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import { getProducts } from "../services/productService";

import { getDaysUntilExpiration } from "../utils/expiration";

import {
  LOW_STOCK_LIMIT,
  EXPIRATION_WARNING_DAYS,
} from "../constants/inventory";

export default function Dashboard() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
      const loadProducts = async () => {
    try {
      setError("");

      const response = await getProducts();

      setProducts(response.data);
    } catch (error) {
      console.error(error);

      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setLoading(false);
    }
  };
    loadProducts();
  }, []);



  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) => product.stock <= LOW_STOCK_LIMIT,
  ).length;

  const expiringProducts = products.filter((product) => {
    const daysRemaining = getDaysUntilExpiration(product.expirationDate);

    return daysRemaining >= 0 && daysRemaining <= EXPIRATION_WARNING_DAYS;
  }).length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-gray-500">Resumen general del inventario.</p>
      </div>

      <div className="mt-6">
        {loading && <Spinner />}
        {!loading && error && <ErrorMessage message={error} />}
      </div>

      {!loading && !error && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard title="Total de productos" value={totalProducts} />
            <StatCard title="Stock bajo" value={lowStockProducts} />
            <StatCard title="Próximos a vencer" value={expiringProducts} />
          </div>

          <RecentProducts products={products} />
        </>
      )}
    </div>
  );
}
