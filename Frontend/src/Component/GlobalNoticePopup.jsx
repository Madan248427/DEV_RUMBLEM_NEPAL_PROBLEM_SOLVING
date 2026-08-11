import { useEffect } from "react";
import { notification } from "antd";
import axiosInstance from "../axiosInstance";

const GlobalNoticePopup = () => {
  useEffect(() => {
    // Request permission for browser notifications
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    showUnreadNotices();

    // Poll for new notices every 30 seconds
    const interval = setInterval(showUnreadNotices, 30000);
    return () => clearInterval(interval);
  }, []);

  const showUnreadNotices = async () => {
    try {
      const res = await axiosInstance.get("/notices/");
      const notices = res.data.results || res.data;

      if (!notices.length) return;

      const seenNotices = JSON.parse(sessionStorage.getItem("seenNotices") || "[]");

      for (const notice of notices) {
        if (!notice.read && !seenNotices.includes(notice.id)) {
          // Ant Design popup
          notification.open({
            message: notice.title,
            description: notice.message,
            placement: "topRight",
            duration: 6,
          });

          // Browser notification (only for new notices)
          if (window.Notification && Notification.permission === "granted") {
            new Notification(notice.title, {
              body: notice.message,
            });
          }

          // Mark as read in backend
          await axiosInstance.post("/notice-read/", {
            notice: notice.id,
          });

          // Track in sessionStorage so we don't show it again
          sessionStorage.setItem(
            "seenNotices",
            JSON.stringify([...seenNotices, notice.id])
          );
        }
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  return null;
};

export default GlobalNoticePopup;
