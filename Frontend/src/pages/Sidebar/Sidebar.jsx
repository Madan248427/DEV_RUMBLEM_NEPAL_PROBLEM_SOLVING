import React, { useMemo, useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Badge } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  SwapOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  FileTextOutlined,
  TransactionOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../axiosInstance";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);

  const role = user?.role; // 🔥 important

  /* ================= NOTIFICATIONS ================= */
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const res = await axiosInstance.get("/notifications/");
        const data = Array.isArray(res.data) ? res.data : [];
        const unread = data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  /* ================= PROFILE ================= */
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/accounts/profile/");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    fetchProfile();
  }, [user]);

  /* ================= ROLE BASED MENUS ================= */

  const userMenu = [
    { path: "/user-dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { path: "/books", icon: <BookOutlined />, label: "Browse Books" },
    { path: "/issued-books", icon: <SwapOutlined />, label: "My Books" },
    {
      path: "/notifications",
      icon: <BellOutlined />,
      label: "Notifications",
      badge: true,
    },
  ];

  const employeeMenu = [
    { path: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { path: "/book-list", icon: <BookOutlined />, label: "Manage Books" },
    { path: "/add-book", icon: <PlusOutlined />, label: "Add Book" },
    { path: "/transaction", icon: <TransactionOutlined />, label: "Transactions" },
    { path: "/notices", icon: <FileTextOutlined />, label: "Notices" },
  ];

  const settingsMenu = [
    { path: "/profile", icon: <UserOutlined />, label: "Profile" },
    { path: "/edit-profile", icon: <SettingOutlined />, label: "Settings" },
  ];

  const menuItems = useMemo(() => {
    if (role === "employee") return employeeMenu;
    return userMenu;
  }, [role]);

  /* ================= LOGOUT ================= */
  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? <CloseOutlined /> : <MenuOutlined />}
      </button>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BookOutlined />
          </div>
          <h2>Marvel Nexus</h2>
        </div>

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt="Profile"
                className="sidebar-avatar-image"
              />
            ) : (
              <div className="sidebar-avatar-placeholder">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="sidebar-profile-info">
            <h4>{user?.username}</h4>
            <p>{role === "employee" ? "Employee" : "User"}</p>
          </div>
        </div>

        {/* Main Menu */}
        <p className="sidebar-section-label">Main Menu</p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.icon}
              <span>{item.label}</span>

              {item.badge && unreadCount > 0 && (
                <Badge
                  count={unreadCount}
                  size="small"
                  className="sidebar-notification-badge"
                />
              )}
            </NavLink>
          ))}

          <div className="sidebar-divider" />

          <p className="sidebar-section-label">Account</p>

          {settingsMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-logout">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogoutOutlined />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;