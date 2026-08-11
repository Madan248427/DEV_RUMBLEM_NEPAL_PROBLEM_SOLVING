import React, { useState, useEffect } from "react";
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
import axiosInstance from "../../axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const { Sider } = Layout;

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD NOTICES ================= */
  


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
        <Badge count={unreadCount} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: "Notices",
      onClick: () => navigate("/notices"),
    },
  ];

  /* ================= USER DROPDOWN ================= */
  const userMenu = [
    {
      key: "profile",
      label: "Profile",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: () => {
        onLogout();
        navigate("/login");
      },
    },
  ];

  if (loading) return <Spin />;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      className="sidebar"
      width={250}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <h2>{collapsed ? "LMS" : "Library"}</h2>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <Dropdown menu={{ items: userMenu }} placement="topRight">
          <Space className="user-info" style={{ cursor: "pointer" }}>
            <Avatar icon={<UserOutlined />} />
            {!collapsed && (
              <div className="user-details">
                <p className="user-name">{user?.username || "Employee"}</p>
                <p className="user-role">
                  {(user?.Role || user?.role || "employee").toLowerCase()}
                </p>
              </div>
            )}
          </Space>
        </Dropdown>
      </div>

      {/* Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="sidebar-menu"
      />

      {/* Footer Logout */}
      <div className="sidebar-footer">
        <Button
          type="primary"
          danger
          block
          icon={<LogoutOutlined />}
          onClick={() => {
            onLogout();
            navigate("/login");
          }}
        >
          {collapsed ? "" : "Logout"}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;
