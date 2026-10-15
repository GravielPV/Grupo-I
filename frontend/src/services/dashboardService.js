import { getProducts } from "./productService";
import { getSales } from "./saleService";

export async function loadDashboardData(productsRequest = getProducts, salesRequest = getSales) {
  const [products, sales] = await Promise.allSettled([productsRequest(), salesRequest()]);
  if (products.status === "rejected") throw products.reason;
  return {
    products: products.value.data,
    sales: sales.status === "fulfilled" ? sales.value.data : [],
    salesError: sales.status === "fulfilled" ? "" : sales.reason.response?.status === 404
      ? "El módulo de ventas aún no está disponible en el servidor. Las métricas de ventas no se pueden consultar."
      : "No se pudieron cargar las ventas. Las métricas de ventas no están disponibles.",
  };
}
