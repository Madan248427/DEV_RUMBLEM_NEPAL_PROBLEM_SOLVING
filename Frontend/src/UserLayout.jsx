import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "./pages/Sidebar/Sidebar";
import "./UserLayout.css";

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    // 1. Clear all local storage tokens
    localStorage.clear();
    
    // 2. Clear any session storage just in case
    sessionStorage.clear();

    // 3. Force a complete browser hard reload to the login page
    // This wipes out any active React state, context hooks, or lingering API tokens.
    window.location.href = "/login";
  };

  return (
    <div className="user-layout">
      {/* Sidebar with embedded collapse toggle button */}
      <UserSidebar 
        onLogout={handleLogout} 
        collapsed={collapsed} 
        onToggleCollapse={toggleSidebar} 
      />

      {/* Main content wrapper */}
      <main className="user-main">
        <div className="layout-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout;