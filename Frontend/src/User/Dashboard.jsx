import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Spin, Button, message, Badge } from "antd";
import {
  BookOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosInstance";

import "./Dashboard.css";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const hasFetched = useRef(false);
  const notificationSound = useRef(
    new Audio("/sounds/notification.mp3") // put a small mp3 in public/sounds/
  );

 useEffect(() => {
  if (authLoading) return;
  if (!user) {
    setLoading(false);
    return;
  }

  if (hasFetched.current) return;
  hasFetched.current = true;

  const loadData = async () => {
    try {
      const [booksRes, txRes, notifRes] = await Promise.all([
        axiosInstance.get("/books/"),
        axiosInstance.get("/transactions/"),
        axiosInstance.get("/notifications/"),
      ]);

      const booksData = Array.isArray(booksRes.data)
        ? booksRes.data
        : booksRes.data?.results || [];
      const txData = Array.isArray(txRes.data)
        ? txRes.data
        : txRes.data?.results || [];
      const notifData = Array.isArray(notifRes.data) ? notifRes.data : [];

      setBooks(booksData);
      setTransactions(txData);
      setNotifications(notifData);

      // Track unread
      const unread = notifData.filter((n) => !n.is_read);
      setUnreadCount(unread.length);

      // Handle browser notification for new notifications
      const lastNotifiedId = Number(localStorage.getItem("lastNotifiedNotificationId") || 0);

      const newNotifications = notifData.filter(
        (n) => !n.is_read && n.id > lastNotifiedId
      );

      if (newNotifications.length > 0) {
        const latest = newNotifications[0];

        // Browser popup
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Notification", { body: latest.message });
        }

        // Play sound
        notificationSound.current.play().catch(() => {});

        // Update localStorage so we only notify once
        localStorage.setItem("lastNotifiedNotificationId", latest.id);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setBooks([]);
      setTransactions([]);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  loadData();

  // Poll every 30s for truly new notifications
  const interval = setInterval(loadData, 30000);
  return () => clearInterval(interval);
}, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const issuedCount = transactions.filter(
      (t) => t.transaction_type === "issued" && !t.returned_at
    ).length;
    const reservedCount = transactions.filter(
      (t) => t.transaction_type === "reserved" && !t.returned_at
    ).length;
    const overdueCount = transactions.filter(
      (t) =>
        t.transaction_type === "issued" &&
        !t.returned_at &&
        new Date(t.due_at) < new Date()
    ).length;

    return { totalBooks, issuedCount, reservedCount, overdueCount };
  }, [books, transactions]);

  const recentBooks = useMemo(() => books.slice(0, 5), [books]);

  const recentActivity = useMemo(() => {
    return transactions.slice(0, 6).map((tx) => {
      const book = books.find((b) => b.id === tx.book);
      return { ...tx, bookTitle: book?.title || `Book #${tx.book}` };
    });
  }, [transactions, books]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Stats cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon blue"><BookOutlined /></div>
          <div className="stat-info">
            <h3>{stats.totalBooks}</h3>
            <p>Total Books</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><SwapOutlined /></div>
          <div className="stat-info">
            <h3>{stats.issuedCount}</h3>
            <p>Currently Issued</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><ClockCircleOutlined /></div>
          <div className="stat-info">
            <h3>{stats.reservedCount}</h3>
            <p>Reserved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><WarningOutlined /></div>
          <div className="stat-info">
            <h3>{stats.overdueCount}</h3>
            <p>Overdue</p>
          </div>
        </div>
      </div>

      {/* Recent Books */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recent Books</h3>
            <Button
              type="link"
              onClick={() => navigate("/books")}
              style={{ color: "#4361ee", fontWeight: 600, padding: 0 }}
            >
              View All <ArrowRightOutlined />
            </Button>
          </div>
          {recentBooks.length === 0 ? (
            <p style={{ color: "#8a94a6", fontSize: 13 }}>No books found</p>
          ) : (
            recentBooks.map((book) => {
              const coverUrl = book.cover_image_url
                ? `http://127.0.0.1:8000${book.cover_image_url}`
                : null;

              return (
                <div
                  key={book.id}
                  className="recent-book-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  {coverUrl ? (
                    <img className="recent-book-cover" src={coverUrl} alt={book.title} />
                  ) : (
                    <div className="recent-book-cover-placeholder"><BookOutlined /></div>
                  )}
                  <div className="recent-book-info">
                    <h4>{book.title}</h4>
                    <p>{book.authors}</p>
                  </div>
                  <Tag
                    color={
                      book.status === "available"
                        ? "green"
                        : book.status === "issued"
                        ? "blue"
                        : "orange"
                    }
                  >
                    {book.status}
                  </Tag>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header"><h3>Recent Activity</h3></div>
          {recentActivity.length === 0 ? (
            <p style={{ color: "#8a94a6", fontSize: 13 }}>No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-dot ${activity.transaction_type}`} />
                <div className="activity-text">
                  <p><strong>{activity.bookTitle}</strong> was {activity.transaction_type}</p>
                  <span>
                    {new Date(activity.issued_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
