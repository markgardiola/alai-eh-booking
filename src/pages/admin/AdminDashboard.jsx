import React, { useCallback, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminSideBar from "../../components/AdminSideBar";
import AdminTopBar from "../../components/AdminTopBar";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signIn" replace />;
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <AdminSideBar open={sidebarOpen} onClose={closeSidebar} />
      <div className="lg:ml-64">
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
