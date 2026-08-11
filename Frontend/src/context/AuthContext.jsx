"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import axiosInstance, { markLoggedOut } from "../axiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedUser = useRef(false);

  // Fetch current logged-in user and normalize role to lowercase
  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/accounts/me/");
      setUser({ ...res.data, role: res.data.Role?.toLowerCase() }); // normalize role
      return res.data;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
      hasFetchedUser.current = true;
    }
  };

  // Always check auth on app load
  useEffect(() => {
    if (!hasFetchedUser.current) {
      fetchUser();
    }
  }, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      await axiosInstance.post("/accounts/login/", { email, password });
      const loggedInUser = await fetchUser();
      return { success: true, user: loggedInUser };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || "Login failed" };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await axiosInstance.post("/accounts/logout/");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      markLoggedOut();
      setUser(null);
      hasFetchedUser.current = true;
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);