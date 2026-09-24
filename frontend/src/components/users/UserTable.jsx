export default function UserTable({ users, onDelete, currentUserId }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-5 py-4">Nombre</th>

              <th className="px-5 py-4">Usuario</th>

              <th className="px-5 py-4">Rol</th>

              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-5 py-10 text-center text-gray-500"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {user.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">{user.username}</td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.role === "admin" ? "Administrador" : "Empleado"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    {user.id !== currentUserId ? (
                      <button
                        onClick={() => onDelete(user)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">
                        Usuario actual
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
