import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import SaleProductSearch from "../components/sales/SaleProductSearch";
import SaleCart from "../components/sales/SaleCart";

import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import Spinner from "../components/common/Spinner";

import { getProducts } from "../services/productService";
import { createSale } from "../services/saleService";

export default function NewSale() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = async () => {
    try {
      const response = await getProducts();

      setProducts(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No se pudieron actualizar los medicamentos.",
      );
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();

        setProducts(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar los medicamentos.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddProduct = (product) => {
    setError("");
    setSuccess("");

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product._id === product._id,
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  const handleIncrease = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.product._id !== productId) {
          return item;
        }

        if (item.quantity >= item.product.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  };

  const handleDecrease = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product._id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemove = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product._id !== productId),
    );
  };

  const total = cart.reduce(
    (accumulator, item) => accumulator + item.product.price * item.quantity,
    0,
  );

  const handleCompleteSale = async () => {
    if (cart.length === 0 || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
      };

      const response = await createSale(payload);

      setCart([]);

      setSuccess(`Venta ${response.data.saleNumber} registrada correctamente.`);

      await loadProducts();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo completar la venta.",
      );

      // El stock pudo cambiar desde que cargamos la pantalla.
      await loadProducts();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShoppingCart size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nueva venta
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Busca medicamentos y agrégalos a la venta.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {success && (
        <div className="mb-6">
          <SuccessMessage message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <SaleProductSearch
            products={products}
            search={search}
            onSearchChange={setSearch}
            onAddProduct={handleAddProduct}
          />

          <SaleCart
            items={cart}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onRemove={handleRemove}
            total={total}
            onCompleteSale={handleCompleteSale}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}
