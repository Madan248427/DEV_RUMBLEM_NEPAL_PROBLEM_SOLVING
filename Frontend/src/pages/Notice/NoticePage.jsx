import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Notice.css";

const NoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/notices/");
      setNotices(response.data);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError("Failed to load municipal notices. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gov-dashboard-wrapper">
        <Header />
        <div className="gov-loader">Loading Municipal Notices...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="gov-dashboard-wrapper">
      <Header />

      <div className="notice-hero-section">
        <div className="notice-hero-overlay">
          <div className="notice-hero-content">
            <h1>Official Municipal Notices</h1>
            <p>Stay updated with the latest announcements, safety alerts, and community updates from city authorities.</p>
          </div>
        </div>
      </div>

      <div className="notice-main-container">
        {error && <div className="gov-alert error">{error}</div>}

        <div className="notice-section-header">
          <h2>Active Announcements ({notices.length})</h2>
          <p>Read official notices published by the administration.</p>
        </div>

        {notices.length === 0 ? (
          <div className="notice-empty-card">
            <h3>No Notices Available</h3>
            <p>There are no active municipal notices posted at this time.</p>
          </div>
        ) : (
          <div className="notice-cards-grid">
            {notices.map((notice) => (
              <div key={notice.id || notice.pk} className="notice-card">
                <div className="notice-card-header">
                  <span className="notice-badge">Official Update</span>
                  <span className="notice-date">
                    {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : "Recent"}
                  </span>
                </div>
                
                <h3>{notice.title || notice.subject || "Municipal Notice"}</h3>
                <p className="notice-text">{notice.description || notice.content || notice.message}</p>

                {notice.file && (
                  <div className="notice-attachment">
                    <a href={notice.file} target="_blank" rel="noopener noreferrer" className="btn-attachment">
                      📎 View Attachment / Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default NoticePage;