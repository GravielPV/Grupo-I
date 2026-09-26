import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductForm from "../components/products/ProductForm";
import { createProduct } from "../services/productService";

import { getCategories } from "../services/categoryService";

export default function AddProduct() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const [categories, setCategories] = useState([])
const [loadingCategories, setLoadingCategories] = useState(true)

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

  useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await getCategories()

      setCategories(response.data)
    } catch (error) {
      console.error(
        "Error al cargar las categorías:",
        error
      )

      setError(
        "No se pudieron cargar las categorías."
      )
    } finally {
      setLoadingCategories(false)
    }
  }

  loadCategories()
}, [])

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
      {loadingCategories } 

      <ProductForm
      
        categories={categories}
        onSubmit={handleSubmit}
        buttonText={loading ? "Guardando..." : "Guardar producto"}
        loading={loading}
      />
    </div>
  );
}
