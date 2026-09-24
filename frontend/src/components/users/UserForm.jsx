import { useState } from "react";
import Button from "../common/Button";

export default function UserForm({ onSubmit, loading = false }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "employee",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }

    if (!form.username.trim()) {
      newErrors.username = "El usuario es obligatorio.";
    }

    if (!form.password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (form.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!["admin", "employee"].includes(form.role)) {
      newErrors.role = "Selecciona un rol válido.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(form);

    if (success) {
      setForm({
        name: "",
        username: "",
        password: "",
        role: "employee",
      });

      setErrors({});
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nombre
          </label>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Usuario
          </label>

          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Contraseña
          </label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Rol
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="employee">Empleado</option>

            <option value="admin">Administrador</option>
          </select>

          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
