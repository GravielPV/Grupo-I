import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">Pharmacy</h1>
      </div>

      <nav className="flex-1 px-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `block rounded-lg px-4 py-3 ${
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `mt-2 block rounded-lg px-4 py-3 ${
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          Inventario
        </NavLink>

        {user?.role === "admin" && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `mt-2 block rounded-lg px-4 py-3 ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            Usuarios
          </NavLink>
        )}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3">
          <p className="font-medium text-gray-800">{user?.name}</p>

          <p className="text-sm text-gray-500">
            {user?.role === "admin" ? "Administrador" : "Empleado"}
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
