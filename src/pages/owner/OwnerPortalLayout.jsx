import React, { useCallback, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import OwnerSideBar from "../../components/OwnerSideBar";
import OwnerTopBar from "../../components/OwnerTopBar";

const OwnerPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/owner/login" replace />;
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <OwnerSideBar open={sidebarOpen} onClose={closeSidebar} />
      <div className="lg:ml-64">
        <OwnerTopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default OwnerPortalLayout;
