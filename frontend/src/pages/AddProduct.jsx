import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductForm from "../components/products/ProductForm";
import { createProduct } from "../services/productService";

export default function AddProduct() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError("");

      await createProduct({
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
      });

      navigate("/products", {
        state: {
          successMessage: "Producto creado correctamente.",
        },
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo crear el producto.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agregar producto</h1>

        <p className="mt-1 text-gray-500">
          Registra un nuevo medicamento en el inventario.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <ProductForm
        onSubmit={handleSubmit}
        buttonText={loading ? "Guardando..." : "Guardar producto"}
        loading={loading}
      />
    </div>
  );
}
