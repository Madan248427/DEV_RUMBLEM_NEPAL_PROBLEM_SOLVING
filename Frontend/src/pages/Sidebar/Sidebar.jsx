import React, { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Spin } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  DashboardOutlined,
  BellOutlined,
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const { Sider } = Layout;

const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [unreadCount] = useState(0);
  const [loading] = useState(false);

  // Guaranteed logout action utilizing context logout + storage clearance fallback
  const handleLogoutAction = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.error("Logout context error:", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  /* ================= MENU ITEMS ================= */
  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "/public-reports",
      icon: <FileTextOutlined />,
      label: "Reports",
      onClick: () => navigate("/public-reports"),
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "User Profile",
      onClick: () => navigate("/profile"),
    },
    {
      key: "/notices",
      icon: (
        <Badge count={unreadCount} size="small" offset={[4, 0]}>
          <BellOutlined />
        </Badge>
      ),
      label: "Notices",
      onClick: () => navigate("/notices"),
    },
  ];

  /* ================= USER DROPDOWN ================= */
  const userMenu = {
    items: [
      {
        key: "profile",
        label: "Profile Settings",
        icon: <UserOutlined />,
        onClick: () => navigate("/profile"),
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        label: "Sign Out",
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogoutAction,
      },
    ],
  };

  if (loading) {
    return (
      <div className="sidebar-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="modern-sidebar"
      width={260}
      collapsedWidth={80}
    >
      {/* Brand Logo Header with integrated Collapse Button */}
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: '16px 12px' }}>
        <div className="brand-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div className="brand-icon-wrapper">
            <BookOutlined />
          </div>
          {!collapsed && <h2 className="brand-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>Hamro<span>Nepal</span></h2>}
        </div>
        <button 
          className="sidebar-collapse-icon-btn" 
          onClick={onToggleCollapse} 
          title={collapsed ? "Expand Menu" : "Collapse Menu"}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </div>

      {/* User Profile Widget Card */}
      <div className="sidebar-user-section">
        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
          <div className="user-profile-card">
            <Avatar className="user-avatar" icon={<UserOutlined />} />
            {!collapsed && (
              <div className="user-info-text">
                <span className="user-name">{user?.username || "Citizen User"}</span>
                <span className="user-role-tag">
                  {(user?.Role || user?.role || "Citizen").toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </Dropdown>
      </div>

      {/* Navigation Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="sidebar-nav-menu"
      />

      {/* Footer Logout Action Area */}
      <div className="sidebar-bottom-action">
        <Button
          type="text"
          danger
          block
          icon={<LogoutOutlined />}
          className="sidebar-logout-btn"
          onClick={handleLogoutAction}
        >
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;