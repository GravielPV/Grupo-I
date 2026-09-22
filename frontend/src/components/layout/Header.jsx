import { useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const titles = {
    "/": "Dashboard",
    "/products": "Inventario",
    "/products/new": "Agregar producto",
    "/users": "Usuarios",
  };

  const title = titles[location.pathname] || "Pharmacy";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

      <span className="text-sm text-gray-500">Administrador</span>
    </header>
  );
}
