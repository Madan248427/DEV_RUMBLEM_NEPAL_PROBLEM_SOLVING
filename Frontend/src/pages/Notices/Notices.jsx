import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Notices.css";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State for creating a new notice
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/notices/"); // Adjust endpoint if different in your router
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setNotices(data);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
      setError("Failed to load organization notices.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const response = await axiosInstance.post("/notices/", formData);
      setNotices((prev) => [response.data, ...prev]);
      setFormSuccess(true);
      setFormData({ title: "", description: "" });
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to create notice:", err);
      setFormError(err.response?.data?.detail || "Failed to publish notice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="gov-dashboard-wrapper">
        <Header />
        <main className="notices-loading-area">
          <div className="gov-loader">Loading Official Notices...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="gov-dashboard-wrapper">
      <Header />

      <div className="notices-hero-section">
        <div className="notices-hero-overlay">
          <div className="notices-hero-content">
            <h1>Official Organization Notices</h1>
            <p>Publish bulletins, updates, and announcements for municipal stakeholders.</p>
          </div>
        </div>
      </div>

      <main className="notices-main-container">
        {error && <div className="gov-alert error">{error}</div>}

        {/* Create Notice Panel */}
        <div className="notice-form-card">
          <h2>📢 Publish New Notice</h2>
          {formSuccess && <div className="gov-alert success">✓ Notice published successfully!</div>}
          {formError && <div className="gov-alert error">{formError}</div>}

          <form onSubmit={handleCreateNotice} className="notice-form">
            <div className="form-group">
              <label htmlFor="title">Notice Title</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Scheduled Maintenance Bulletin"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Notice Description & Details</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="Write full notice details here..."
                value={formData.description}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-publish-notice" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "🚀 Publish Notice"}
            </button>
          </form>
        </div>

        {/* Feed of Notices */}
        <div className="notices-list-section">
          <h2>Published Announcements ({notices.length})</h2>

          {notices.length === 0 ? (
            <div className="notices-empty-card">
              <p>No notices have been published yet.</p>
            </div>
          ) : (
            <div className="notices-grid">
              {notices.map((notice) => (
                <article key={notice.id} className="notice-card">
                  <div className="notice-card-header">
                    <h3>{notice.title}</h3>
                    <span className="notice-date">
                      {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="notice-description">{notice.description}</p>
                  <div className="notice-card-footer">
                    <small>Posted by: <strong>{notice.created_by?.username || notice.created_by_username || "Organizer"}</strong></small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notices;