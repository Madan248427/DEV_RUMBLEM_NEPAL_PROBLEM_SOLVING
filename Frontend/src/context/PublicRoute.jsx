"use client";

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = () => {
  const { user, loading } = useAuth();
  console.log("USER:", user);

  if (loading) return <div>Loading...</div>;

  if (user?.role === "employee") return <Navigate to="/dashboard" replace />;
  if (user?.role === "user") return <Navigate to="/user-dashboard" replace />;

  return <Outlet />;
};

export default PublicRoute;