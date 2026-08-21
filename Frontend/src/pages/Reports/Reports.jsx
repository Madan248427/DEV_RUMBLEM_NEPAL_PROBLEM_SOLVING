import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Reports.css";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [acceptedReportIds, setAcceptedReportIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingMap, setAcceptingMap] = useState({});

  const BACKEND_URL = "https://cfcf-182-93-68-229.ngrok-free.app";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${BACKEND_URL.replace(/\/$/, "")}/${imagePath.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportsRes = await axiosInstance.get("/problem/reports/");
      const reportsData = Array.isArray(reportsRes.data)
        ? reportsRes.data
        : reportsRes.data.results || [];

      setReports(reportsData);

      try {
        const acceptedRes = await axiosInstance.get(
          "/organization/problem-reports/"
        );
        const acceptedData = Array.isArray(acceptedRes.data)
          ? acceptedRes.data
          : acceptedRes.data.results || [];

        const acceptedIds = new Set(
          acceptedData.map((item) =>
            typeof item.problem === "object" ? item.problem.id : item.problem
          )
        );
        setAcceptedReportIds(acceptedIds);
      } catch (acceptedErr) {
        console.warn("Could not fetch organization accepted list:", acceptedErr);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to fetch incident reports from the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReport = async (reportId) => {
    if (acceptingMap[reportId]) return;

    setAcceptingMap((prev) => ({ ...prev, [reportId]: true }));

    try {
      await axiosInstance.post("/organization/problem-reports/", {
        problem: reportId,
      });

      setAcceptedReportIds((prev) => new Set(prev).add(reportId));
      setReports((prevReports) =>
        prevReports.map((item) =>
          item.id === reportId ? { ...item, status: "in_progress" } : item
        )
      );

      alert("Problem report successfully accepted!");
    } catch (err) {
      console.error("Failed to accept report:", err);
      const errorMsg =
        err.response?.data?.problem ||
        err.response?.data?.detail ||
        "Could not accept this problem report.";
      alert(errorMsg);
    } finally {
      setAcceptingMap((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="gov-dashboard-wrapper">
        <Header />
        <main className="reports-loading-area">
          <div className="gov-loader">Loading Incident Reports...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="gov-dashboard-wrapper">
      <Header />

      <div className="reports-hero-section">
        <div className="reports-hero-overlay">
          <div className="reports-hero-content">
            <h1>Organization Incident Management</h1>
            <p>
              Review community-submitted problem reports across the municipality.
              Accept pending issues to assign them to your organization's action timeline.
            </p>
          </div>
        </div>
      </div>

      <main className="reports-main-container">
        {error && <div className="gov-alert error">{error}</div>}

        <div className="reports-section-header">
          <h2>All Civic Reports ({reports.length})</h2>
          <p>Select pending reports below to claim ownership and begin resolution.</p>
        </div>

        {reports.length === 0 ? (
          <div className="reports-empty-card">
            <h3>No Reports Available</h3>
            <p>There are currently no civic problem reports submitted.</p>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => {
              const isAccepted =
                acceptedReportIds.has(report.id) || report.status !== "pending";
              const imageUrl = getImageUrl(report.image);

              return (
                <article key={report.id} className="reports-card">
                  {imageUrl && (
                    <div className="reports-card-image-wrapper">
                      <img
                        src={imageUrl}
                        alt={report.title}
                        className="reports-card-image"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span
                        className={`reports-severity-badge severity-${report.severity}`}
                      >
                        {report.severity ? report.severity.toUpperCase() : "MEDIUM"}
                      </span>
                    </div>
                  )}

                  <div className="reports-card-body">
                    <div className="reports-card-meta-top">
                      <span className="reports-category-tag">
                        {report.category_name || "Civic Issue"}
                      </span>

                      <span
                        className={`reports-status-badge status-${report.status}`}
                      >
                        {report.status ? report.status.replace("_", " ") : "pending"}
                      </span>
                    </div>

                    <h3>{report.title}</h3>
                    <p className="reports-desc">{report.description}</p>

                    <div className="reports-location-block">
                      <span>📍 {report.location}</span>
                      {report.latitude != null && report.longitude != null && (
                        <span className="reports-gps">
                          🌍 {report.latitude}, {report.longitude}
                        </span>
                      )}
                    </div>

                    <div className="reports-card-footer">
                      <div className="reports-author-info">
                        <small>
                          Reported by:{" "}
                          <strong>
                            {report.reported_by?.username || "Citizen"}
                          </strong>
                        </small>
                        {report.created_at && (
                          <small className="reports-date">
                            {new Date(report.created_at).toLocaleDateString()}
                          </small>
                        )}
                      </div>

                      <div className="reports-action-wrapper">
                        {isAccepted ? (
                          <span className="badge-accepted-status">
                            ✓ Accepted
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-accept-report"
                            onClick={() => handleAcceptReport(report.id)}
                            disabled={acceptingMap[report.id]}
                          >
                            {acceptingMap[report.id]
                              ? "Accepting..."
                              : "🤝 Accept Report"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Reports;