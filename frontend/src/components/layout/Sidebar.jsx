import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">Pharmacy</h1>
      </div>

      <nav className="px-4">
        <NavLink
          to="/"
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
      </nav>
    </aside>
  );
}
