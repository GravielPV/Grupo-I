import { useState } from "react"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log({
      username,
      password
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Pharmacy
          </h1>

          <p className="mt-2 text-gray-500">
            Sistema de gestión de inventario
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Usuario */}
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Contraseña */}
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Iniciar sesión
            </button>

          </form>

        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Pharmacy © 2026
        </p>

      </div>

    </div>
  )
}