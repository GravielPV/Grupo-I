import { NavLink } from "react-router-dom";

import useAuth from "../../context/useAuth";
import { ROLES, ROLE_LABELS } from "../../constants/roles";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-4 py-3 text-sm font-medium ${
      isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-64
          flex-col border-r bg-white
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold text-blue-600">Pharmacy</h1>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4">
          <NavLink to="/" end onClick={onClose} className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink
            to="/products"
            onClick={onClose}
            className={({ isActive }) => `mt-2 ${linkClass({ isActive })}`}
          >
            Inventario
          </NavLink>

          {user?.role === ROLES.ADMIN && (
            <NavLink
              to="/users"
              onClick={onClose}
              className={({ isActive }) => `mt-2 ${linkClass({ isActive })}`}
            >
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3">
            <p className="font-medium text-gray-800">{user?.name}</p>

            <p className="text-sm text-gray-500">{ROLE_LABELS[user?.role]}</p>
          </div>

          <button
            onClick={logout}
            className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
