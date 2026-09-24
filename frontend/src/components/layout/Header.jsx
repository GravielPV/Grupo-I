import { useLocation } from "react-router-dom";
import useAuth from "../../context/useAuth";

export default function Header({ onMenuClick }) {
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
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Menú móvil */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Abrir menú"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">{user?.name}</p>
        <p className="hidden text-xs text-gray-500 sm:block">
          {user?.role === "admin" ? "Administrador" : "Empleado"}
        </p>
      </div>
    </header>
  );
}
