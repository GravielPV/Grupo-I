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

        <Route path="/login" element={<Login />} />


        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            <Route index element={<Dashboard />} />

            <Route path="products" element={<Products />} />

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
