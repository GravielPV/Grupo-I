import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../common/Button";
import { PRODUCT_CATEGORIES } from "../../constants/categories";

export default function ProductForm({
  initialData = {},
  onSubmit,
  buttonText = "Guardar producto",
  loading = false,
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: initialData.name || "",
    category: initialData.category || "",
    price: initialData.price || "",
    stock: initialData.stock ?? "",
    expirationDate: initialData.expirationDate || "",
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

    // Nombre
    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }

    // Categoría
    if (!form.category) {
      newErrors.category = "Selecciona una categoría.";
    }

    // Precio
    if (form.price === "") {
      newErrors.price = "El precio es obligatorio.";
    } else if (Number(form.price) <= 0) {
      newErrors.price = "El precio debe ser mayor que 0.";
    }

    // Stock
    if (form.stock === "") {
      newErrors.stock = "El stock es obligatorio.";
    } else if (Number(form.stock) < 0) {
      newErrors.stock = "El stock no puede ser negativo.";
    } else if (!Number.isInteger(Number(form.stock))) {
      newErrors.stock = "El stock debe ser un número entero.";
    }

    // Fecha
    if (!form.expirationDate) {
      newErrors.expirationDate = "La fecha de vencimiento es obligatoria.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiration = new Date(`${form.expirationDate}T00:00:00`);

      if (expiration <= today) {
        newErrors.expirationDate = "La fecha debe ser posterior a hoy.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    await onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Nombre */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nombre del producto
          </label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej. Paracetamol 500mg"
            className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
              errors.name
                ? "border-red-400 focus:ring-red-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Categoría
          </label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
              errors.category
                ? "border-red-400 focus:ring-red-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          >
            <option value="">Seleccionar categoría</option>

            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Precio */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Precio
          </label>

          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
              errors.price
                ? "border-red-400 focus:ring-red-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />

          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Stock
          </label>

          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="1"
            className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
              errors.stock
                ? "border-red-400 focus:ring-red-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
          )}
        </div>

        {/* Vencimiento */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Fecha de vencimiento
          </label>

          <input
            type="date"
            name="expirationDate"
            value={form.expirationDate}
            onChange={handleChange}
            className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
              errors.expirationDate
                ? "border-red-400 focus:ring-red-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />

          {errors.expirationDate && (
            <p className="mt-1 text-sm text-red-600">{errors.expirationDate}</p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate("/products")}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button type="submit" disabled={loading}>
          {buttonText}
        </Button>
      </div>
    </form>
  );
}
