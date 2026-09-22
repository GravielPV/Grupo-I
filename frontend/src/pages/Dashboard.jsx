import RecentProducts from "../components/dashboard/RecentProducts";
import StatCard from "../components/dashboard/StatCard";

export default function Dashboard() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        <p className="mt-1 text-gray-500">Resumen general del inventario.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard title="Total de productos" value="125" />

        <StatCard title="Stock bajo" value="8" />

        <StatCard title="Próximos a vencer" value="5" />
      </div>
      <RecentProducts />
    </div>
  );
}
