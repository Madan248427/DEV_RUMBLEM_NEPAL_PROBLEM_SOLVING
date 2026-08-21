import React, { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Space, Button, Badge, Spin } from "antd";
import {
  BookOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SwapOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const { Sider } = Layout;

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount] = useState(0);
  const [loading] = useState(false);

  /* ================= MENU ITEMS ================= */
  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "/add-book",
      icon: <PlusOutlined />,
      label: "Add Book",
      onClick: () => navigate("/add-book"),
    },
    {
      key: "/book-list",
      icon: <BookOutlined />,
      label: "View Books List",
      onClick: () => navigate("/book-list"),
    },
    {
      key: "/transaction",
      icon: <SwapOutlined />,
      label: "Transactions",
      onClick: () => navigate("/transaction"),
    },
    {
      key: "/emp-books",
      icon: <UnorderedListOutlined />,
      label: "Admin View",
      onClick: () => navigate("/emp-books"),
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
        onClick: () => {
          onLogout();
          navigate("/login");
        },
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
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      className="modern-sidebar"
      width={260}
      breakpoint="lg"
    >
      {/* Brand Logo Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <BookOutlined />
        </div>
        {!collapsed && <h2 className="brand-title">Marvel<span>Nexus</span></h2>}
      </div>

      {/* User Profile Card Widget */}
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

      {/* Footer Action Area */}
      <div className="sidebar-bottom-action">
        <Button
          type="text"
          danger
          block
          icon={<LogoutOutlined />}
          className="sidebar-logout-btn"
          onClick={() => {
            onLogout();
            navigate("/login");
          }}
        >
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;