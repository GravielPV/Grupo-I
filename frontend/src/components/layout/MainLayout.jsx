import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="lg:ml-64">
        <Header onMenuClick={openSidebar} />

        <section className="p-4 sm:p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
