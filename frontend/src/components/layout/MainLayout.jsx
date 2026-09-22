import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <main className="ml-64">
        <Header />

        <section className="p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
