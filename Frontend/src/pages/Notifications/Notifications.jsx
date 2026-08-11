import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Spin, Button } from "antd";
import {
  BellOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import fetchApi from "../../axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Notifications.css";

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const lastNotificationIdRef = useRef(0);
  const hasMarkedAllRef = useRef(false); // ✅ prevent repeat marking

  /* =========================
     Fetch notifications
     ========================= */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetchApi.get("/notifications/");
        const data = Array.isArray(res.data) ? res.data : [];
        setNotifications(data);

        // Browser notification for newest unread
        const unread = data.filter((n) => !n.is_read);
        if (unread.length > 0) {
          const latestUnread = unread[0]; // newest first
          if (latestUnread.id > lastNotificationIdRef.current) {
            lastNotificationIdRef.current = latestUnread.id;

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("New Notification", {
                body: latestUnread.message,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  /* =========================
     Auto mark all as read on open
     ========================= */
  useEffect(() => {
    if (!notifications.length) return;
    if (hasMarkedAllRef.current) return;

    const hasUnread = notifications.some((n) => !n.is_read);
    if (!hasUnread) return;

    hasMarkedAllRef.current = true;

    const markAllRead = async () => {
      try {
        await fetchApi.patch("/notifications/mark-all-read/");
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
      } catch (err) {
        console.error("Failed to mark all read", err);
        hasMarkedAllRef.current = false;
      }
    };

    markAllRead();
  }, [notifications]);

  /* =========================
     Request browser permission
     ========================= */
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  /* =========================
     Unread count
     ========================= */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  /* =========================
     Helpers
     ========================= */
  const getNotificationType = useCallback((msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("overdue")) return "overdue";
    if (lower.includes("issued")) return "issued";
    if (lower.includes("returned")) return "returned";
    if (lower.includes("reserved")) return "reserved";
    return "general";
  }, []);

  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case "issued":
        return <SwapOutlined />;
      case "returned":
        return <CheckCircleOutlined />;
      case "reserved":
        return <ClockCircleOutlined />;
      case "overdue":
        return <WarningOutlined />;
      default:
        return <BellOutlined />;
    }
  }, []);

  /* =========================
     Manual mark (optional)
     ========================= */
  const handleMarkRead = async (id) => {
    try {
      await fetchApi.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     Format time
     ========================= */
  const formatTime = useCallback((dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []);

  if (loading) {
    return (
      <div className="center-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h3>
          {unreadCount > 0
            ? `${unreadCount} unread notification${
                unreadCount > 1 ? "s" : ""
              }`
            : "All caught up!"}
        </h3>

        {/* Optional: can remove this button now */}
        {false && unreadCount > 0 && (
          <Button type="link" icon={<CheckOutlined />}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <BellOutlined />
          <h3>Notifications not found</h3>
          <p>You have no notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const type = getNotificationType(n.message);
            return (
              <div
                key={n.id}
                className={`notification-card ${
                  !n.is_read ? "unread" : ""
                }`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className={`notification-icon ${type}`}>
                  {getNotificationIcon(type)}
                </div>

                <div className="notification-body">
                  <h4>{n.book_title || "Library Notification"}</h4>
                  <p>{n.message}</p>
                  <span className="notification-time">
                    {formatTime(n.created_at)}
                  </span>
                </div>

                {!n.is_read && <div className="notification-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
