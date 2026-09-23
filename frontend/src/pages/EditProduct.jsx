import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "../components/products/ProductForm";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Datos temporales
  const product = {
    id,
    name: "Paracetamol 500mg",
    category: "Analgésico",
    price: 120,
    stock: 50,
    expirationDate: "2027-03-20",
  };

  const handleSubmit = (formData) => {
    console.log("Producto actualizado:", {
      id,
      ...formData,
    });

    navigate("/products");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Editar producto</h1>

        <p className="mt-1 text-gray-500">
          Actualiza la información del medicamento.
        </p>
      </div>

      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        buttonText="Actualizar producto"
      />
    </div>
  );
}
