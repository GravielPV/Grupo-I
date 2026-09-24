import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";

export default function Login() {
  const { login, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    navigate("/");

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Pharmacy</h1>

          <p className="mt-2 text-gray-500">Sistema de gestión de inventario</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Usuario
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium">Usuarios de prueba</p>
          <p className="mt-1">Admin: admin / 123456</p>
          <p>Empleado: empleado / 123456</p>
        </div>
      </div>
    </div>
  );
}
