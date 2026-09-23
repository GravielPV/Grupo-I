import { useState } from "react";

import UserTable from "../components/users/UserTable";
import UserForm from "../components/users/UserForm";

export default function Users() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Carlos Pérez",
      username: "carlos01",
      role: "admin",
    },
    {
      id: 2,
      name: "María Rodríguez",
      username: "maria01",
      role: "employee",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleCreate = (user) => {
    const newUser = {
      id: Date.now(),
      ...user,
    };

    setUsers((prev) => [...prev, newUser]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>

          <p className="mt-1 text-gray-500">
            Administra los usuarios del sistema.
          </p>
        </div>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cerrar" : "+ Nuevo usuario"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mt-6">
          <UserForm onSubmit={handleCreate} />
        </div>
      )}

      {/* Tabla */}
      <UserTable users={users} onDelete={handleDelete} />
    </div>
  );
}
