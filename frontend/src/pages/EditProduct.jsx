import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProductForm from "../components/products/ProductForm";

import { getProductById, updateProduct } from "../services/productService";

import { getCategories } from "../services/categoryService"

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([])

useEffect(() => {
  const loadProduct = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        productResponse,
        categoriesResponse
      ] = await Promise.all([getProductById(id), getCategories()])

      const productData =
        productResponse.data

      setProduct({
        ...productData,
        expirationDate:
          productData.expirationDate
            ?.split("T")[0] || ""
      })

      setCategories(
        categoriesResponse.data
      )
    } catch (error) {
      console.error(error)

      setError(
        error.response?.data?.message ||
        "No se pudieron cargar los datos."
      )
    } finally {
      setLoading(false)
    }
  }

  loadProduct()
}, [id])

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError("");

      await updateProduct(id, {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
      });

      navigate("/products", {
        state: {
          successMessage: "Producto actualizado correctamente.",
        },
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo actualizar el producto.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        <p className="text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Editar producto</h1>

        <p className="mt-1 text-gray-500">
          Actualiza la información del medicamento.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <ProductForm
        initialData={product}
        categories={categories}
        onSubmit={handleSubmit}
        buttonText={saving ? "Actualizando..." : "Actualizar producto"}
        loading={saving}
      />
    </div>
  );
}
