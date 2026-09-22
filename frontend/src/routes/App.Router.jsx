import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import Users from "../pages/Users";

import MainLayout from "../components/layout/MainLayout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        <Route
          path="/products"
          element={
            <MainLayout>
              <Products />
            </MainLayout>
          }
        />

        <Route
          path="/products/new"
          element={
            <MainLayout>
              <AddProduct />
            </MainLayout>
          }
        />

        <Route
          path="/products/edit/:id"
          element={
            <MainLayout>
              <EditProduct />
            </MainLayout>
          }
        />

        <Route
          path="/users"
          element={
            <MainLayout>
              <Users />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
