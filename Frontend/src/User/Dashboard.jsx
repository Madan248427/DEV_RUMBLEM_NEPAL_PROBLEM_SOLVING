import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import Header from "../pages/Header/Header";
import Footer from "../pages/Footer/Footer";
import "./Dashboard.css";

const UserDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    severity: "medium",
    location: "",
    latitude: "",
    longitude: "",
    description: "",
    image: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    getGeolocation();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, categoriesRes, reportsRes] = await Promise.all([
        axiosInstance.get("/accounts/profile/"),
        axiosInstance.get("/problem/categories/"),
        axiosInstance.get("/problem/reports/my/"),
      ]);

      console.log("Categories API Response:", categoriesRes.data);

      // Handle both direct arrays and DRF paginated responses ({ results: [...] })
      const categoryData = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data.results || [];

      setCategories(categoryData);
      setUserInfo(profileRes.data);
      setMyReports(
        Array.isArray(reportsRes.data)
          ? reportsRes.data
          : reportsRes.data.results || []
      );

      if (categoryData.length > 0) {
        setFormData((prev) => ({ ...prev, category: categoryData[0].id }));
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load profile data and problem reports.");
    } finally {
      setLoading(false);
    }
  };

  const getGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          console.warn("Geolocation access denied or unavailable:", error.message);
        }
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("category", formData.category);
    payload.append("severity", formData.severity);
    payload.append("location", formData.location);
    if (formData.latitude) payload.append("latitude", formData.latitude);
    if (formData.longitude) payload.append("longitude", formData.longitude);
    payload.append("description", formData.description);
    if (formData.image) payload.append("image", formData.image);

    try {
      const response = await axiosInstance.post("/problem/reports/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMyReports((prev) => [response.data, ...prev]);
      setFormSuccess(true);
      setFormData({
        title: "",
        category: categories.length > 0 ? categories[0].id : "",
        severity: "medium",
        location: "",
        latitude: formData.latitude,
        longitude: formData.longitude,
        description: "",
        image: null,
      });
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err) {
      console.error("Submission error details:", err.response?.data);
      setFormError("Failed to post report. Please check required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="gov-loader">Loading Municipal Portal...</div>;

  return (
    <div className="gov-dashboard-wrapper">
      <Header />

      <div className="gov-hero-section">
        <div className="hero-overlay-content">
          <div className="hero-text-block">
            <h1>All City in Your Hand</h1>
            <p>Empowering citizens to build a smarter, safer community together.</p>
          </div>
          <div className="hero-user-badge">
            <span className="user-greeting">Welcome, {userInfo?.username || "Citizen"}</span>
            {userInfo?.citizenship_number && (
              <span className="citizen-id-chip">ID: {userInfo.citizenship_number}</span>
            )}
          </div>
        </div>
      </div>

      <div className="gov-main-container">
        {error && <div className="gov-alert error">{error}</div>}

        <div className="dashboard-content-grid">
          {/* Report Form */}
          <div className="content-card">
            <div className="card-heading">
              <h3>Report a Civic Issue</h3>
              <p>Submit incidents, road problems, or infrastructure feedback directly.</p>
            </div>

            {formSuccess && <div className="gov-alert success">✓ Report submitted successfully.</div>}
            {formError && <div className="gov-alert error">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="gov-clean-form">
              <div className="form-group">
                <label>Issue Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Broken streetlight near main junction"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="" disabled>-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Severity Level</label>
                  <select name="severity" value={formData.severity} onChange={handleInputChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Location / Ward Address *</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Ward No. 3, City Center"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="Auto-detected GPS"
                    value={formData.latitude}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    placeholder="Auto-detected GPS"
                    value={formData.longitude}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Provide precise details about the problem..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Upload Photo</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>

              <button type="submit" className="btn-primary-green" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>

          {/* Submitted Feed */}
          <div className="content-card">
            <div className="card-heading">
              <h3>My Submitted Reports ({myReports.length})</h3>
              <p>Track progress status of your active municipal service requests.</p>
            </div>

            <div className="reports-feed">
              {myReports.length === 0 ? (
                <div className="empty-feed-state">
                  <p className="empty-title">No Service Tickets Found</p>
                  <p className="empty-desc">You haven't submitted any civic requests yet.</p>
                </div>
              ) : (
                myReports.map((report) => (
                  <div key={report.id} className="report-list-item">
                    <div className="item-top-row">
                      <span className="item-category">{report.category_name || "General"}</span>
                      <span className={`item-status status-${report.status}`}>{report.status}</span>
                    </div>
                    <h4>{report.title}</h4>
                    <p className="item-desc">{report.description}</p>
                    <div className="item-meta">
                      <span>📍 {report.location}</span>
                      {report.latitude && report.longitude && (
                        <span>🌍 {report.latitude}, {report.longitude}</span>
                      )}
                      <span>📅 {new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserDashboard;