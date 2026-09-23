import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import Users from "../pages/Users";

import MainLayout from "../components/layout/MainLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Todas estas rutas requieren autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />

            {/* Inventario */}
            <Route path="products" element={<Products />} />

            {/* Rutas exclusivas del administrador */}
            <Route element={<RoleRoute roles={["admin"]} />}>
              <Route path="products/new" element={<AddProduct />} />

              <Route path="products/edit/:id" element={<EditProduct />} />

              <Route path="users" element={<Users />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
