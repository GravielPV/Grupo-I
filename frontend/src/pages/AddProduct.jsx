import { useNavigate } from "react-router-dom";
import ProductForm from "../components/products/ProductForm";

export default function AddProduct() {
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    console.log("Producto a guardar:", formData);

    navigate("/products");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agregar producto</h1>

        <p className="mt-1 text-gray-500">
          Registra un nuevo medicamento en el inventario.
        </p>
      </div>

      <ProductForm onSubmit={handleSubmit} buttonText="Guardar producto" />
    </div>
  );
}
