import { useState } from "react"

import Button from "../common/Button"
import ErrorMessage from "../common/ErrorMessage"

export default function CategoryForm({
  onSubmit,
  loading = false
}) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError(
        "El nombre de la categoría es obligatorio."
      )
      return
    }

    setError("")

    const success = await onSubmit({
      name: trimmedName
    })

    if (success) {
      setName("")
    }
  }

  const handleChange = (e) => {
    setName(e.target.value)

    if (error) {
      setError("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 shadow-sm"
      noValidate
    >
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Nueva categoría
      </h2>

      <p className="mb-5 text-sm text-gray-500">
        Agrega una categoría para clasificar los medicamentos.
      </p>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <div>
        <label
          htmlFor="category-name"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Nombre
        </label>

        <input
          id="category-name"
          type="text"
          value={name}
          onChange={handleChange}
          placeholder="Ej. Antihipertensivo"
          className="
            w-full rounded-lg border border-gray-300
            px-3 py-2.5
            outline-none transition
            focus:border-blue-500
            focus:ring-2 focus:ring-blue-100
          "
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="mt-4 w-full sm:w-auto"
      >
        {loading
          ? "Guardando..."
          : "Crear categoría"}
      </Button>
    </form>
  )
}