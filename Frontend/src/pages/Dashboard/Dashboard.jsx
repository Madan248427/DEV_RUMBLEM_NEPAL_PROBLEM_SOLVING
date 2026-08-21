import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import "./Dashboard.css";

const Dashboard = () => {
    const [pendingReports, setPendingReports] = useState([]);
    const [acceptedReports, setAcceptedReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [organizerId, setOrganizerId] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch current user ID for the organization field
            let currentUserId = null;
            try {
                const userRes = await axiosInstance.get("/accounts/me/");
                currentUserId = userRes.data?.id || userRes.data?.pk;
            } catch (err) {
                try {
                    const userResAlt = await axiosInstance.get("/auth/users/me/");
                    currentUserId = userResAlt.data?.id || userResAlt.data?.pk;
                } catch (e) {
                    console.error("Could not fetch user profile automatically", e);
                }
            }

            if (currentUserId) {
                setOrganizerId(currentUserId);
            }

            const [allReportsRes, acceptedRes] = await Promise.all([
                axiosInstance.get("/problem/reports/"),
                axiosInstance.get("/organization/problem-reports/"),
            ]);

            const allReports = Array.isArray(allReportsRes.data)
                ? allReportsRes.data
                : allReportsRes.data?.results || [];

            const accepted = Array.isArray(acceptedRes.data)
                ? acceptedRes.data
                : acceptedRes.data?.results || [];

            // Filter out problems that are already present in accepted assignments
            const acceptedProblemIds = new Set(
                accepted.map((item) => (typeof item.problem === "object" ? item.problem?.id : item.problem))
            );

            const pending = allReports.filter(
                (r) => String(r.status || "").toLowerCase() === "pending" && !acceptedProblemIds.has(r.id)
            );

            setPendingReports(pending);
            setAcceptedReports(accepted);
        } catch (err) {
            console.error("Failed to load organizer dashboard data:", err);
            setError("Failed to fetch reports from the server. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptReport = async (problemId) => {
        setActionLoading(problemId);
        setError(null);
        setSuccessMessage(null);

        try {
            let activeOrgId = organizerId;
            if (!activeOrgId) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const val = localStorage.getItem(key);
                    if (!val) continue;
                    try {
                        const parsed = JSON.parse(val);
                        if (parsed && typeof parsed === "object") {
                            activeOrgId = parsed.id || parsed.user_id || parsed.pk;
                            if (activeOrgId) break;
                        }
                    } catch (e) {}
                }
            }

            if (!activeOrgId) {
                setError("Organizer user ID could not be retrieved. Please try refreshing the page.");
                setActionLoading(null);
                return;
            }

            const payload = {
                organization: activeOrgId,
                problem: problemId,
            };

            await axiosInstance.post("/organization/problem-reports/", payload);

            setSuccessMessage("Problem report successfully accepted and moved to assigned list!");
            
            setPendingReports((prev) => prev.filter((report) => report.id !== problemId));
            await fetchDashboardData();
            
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            console.error("Failed to accept report:", err.response?.data || err);
            const responseData = err.response?.data;

            if (responseData && typeof responseData === "object") {
                const messages = [];
                Object.entries(responseData).forEach(([field, value]) => {
                    if (Array.isArray(value)) {
                        messages.push(`${value.join(", ")}`);
                    } else {
                        messages.push(`${value}`);
                    }
                });
                setError(messages.length > 0 ? messages.join(" | ") : "Failed to accept the report.");
            } else {
                setError("Failed to accept the report.");
            }
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading organizer dashboard...</div>;
    }

    return (
        <div className="dashboard-page-container">
            <section className="emergency-banner-card">
                <div className="emergency-badge">🛡️ Organizer Command Center</div>
                <p className="emergency-text">
                    Review incoming citizen problem reports below and accept them to dispatch action teams.
                </p>
            </section>

            {error && <div className="form-alert error-banner">{error}</div>}
            {successMessage && <div className="form-alert success">{successMessage}</div>}

            <div className="dashboard-main-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="card-panel community-reports-panel">
                    <div className="panel-header flex-header">
                        <h2>📥 Incoming Pending Reports ({pendingReports.length})</h2>
                    </div>

                    <div className="reports-section">
                        {pendingReports.length === 0 ? (
                            <p className="no-data">No pending citizen reports available at the moment.</p>
                        ) : (
                            pendingReports.map((report) => (
                                <div key={report.id} className={`report-card severity-${(report.severity || "low").toLowerCase()}`}>
                                    <div className="report-card-header">
                                        <span className="report-category">
                                            {report.category_detail?.name || report.category_name || report.category || "General"}
                                        </span>
                                        <span className="report-location">📍 {report.location || "Location unavailable"}</span>
                                    </div>

                                    <h4 className="report-title">{report.title || "Untitled Problem"}</h4>
                                    <p className="report-description">{report.description || "No description provided."}</p>

                                    {report.image && (
                                        <div className="report-image-preview">
                                            <img src={report.image} alt={report.title || "Problem"} />
                                        </div>
                                    )}

                                    <div className="report-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                                        <span className="status-pill status-pending">
                                            {report.status || "Pending"}
                                        </span>
                                        
                                        <button
                                            className="submit-btn"
                                            style={{ padding: "8px 16px", fontSize: "14px", width: "auto", margin: 0 }}
                                            onClick={() => handleAcceptReport(report.id)}
                                            disabled={actionLoading === report.id}
                                        >
                                            {actionLoading === report.id ? "Accepting..." : "✅ Accept Report"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card-panel community-reports-panel">
                    <div className="panel-header flex-header">
                        <h2>⚡ Your Accepted Assignments ({acceptedReports.length})</h2>
                    </div>

                    <div className="reports-section">
                        {acceptedReports.length === 0 ? (
                            <p className="no-data">You haven't accepted any problem reports yet.</p>
                        ) : (
                            acceptedReports.map((item) => {
                                const problem = item.problem && typeof item.problem === "object" ? item.problem : item;
                                const category = problem?.category_detail?.name || problem?.category_name || problem?.category || "Assigned Task";

                                return (
                                    <div key={item.id} className="report-card report-solved">
                                        <div className="report-card-header">
                                            <span className="report-category">{category}</span>
                                            <span className="report-location">📍 {problem?.location || item.location || "N/A"}</span>
                                        </div>

                                        <h4 className="report-title">{problem?.title || item.problem_title || "Problem Title"}</h4>
                                        <p className="report-description">{problem?.description || item.problem_description || "No description provided."}</p>

                                        <div className="report-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", flexWrap: "wrap", gap: "10px" }}>
                                            <span className={`status-pill status-${(item.status || "accepted").toLowerCase().replace("_", "-")}`}>
                                                Status: {item.status || "Accepted"}
                                            </span>
                                            <span className="reported-by" style={{ fontSize: "12px", color: "#666" }}>
                                                Accepted At: {item.accepted_at ? new Date(item.accepted_at).toLocaleDateString() : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;