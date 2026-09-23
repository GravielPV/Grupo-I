import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();

  const getTitle = () => {
    if (location.pathname === "/") {
      return "Dashboard";
    }

    if (location.pathname === "/products") {
      return "Inventario";
    }

    if (location.pathname === "/products/new") {
      return "Agregar producto";
    }

    if (location.pathname.startsWith("/products/edit/")) {
      return "Editar producto";
    }

    if (location.pathname === "/users") {
      return "Usuarios";
    }

    return "Pharmacy";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>

      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">{user?.name}</p>

        <p className="text-xs text-gray-500">
          {user?.role === "admin" ? "Administrador" : "Empleado"}
        </p>
      </div>
    </header>
  );
}
