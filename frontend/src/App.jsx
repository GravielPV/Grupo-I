import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import Users from "./pages/Users";

import MainLayout from "./components/layout/MainLayout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas privadas */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/products" element={<Products />} />

          <Route path="/products/new" element={<AddProduct />} />

          <Route path="/products/edit/:id" element={<EditProduct />} />

          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
