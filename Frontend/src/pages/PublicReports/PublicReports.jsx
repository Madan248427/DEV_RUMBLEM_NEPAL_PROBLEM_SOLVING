import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./PublicReports.css";

const PublicReports = () => {
  // =====================================================
  // STATE
  // =====================================================
  const [reports, setReports] = useState([]);
  const [voteData, setVoteData] = useState({});
  const [votingMap, setVotingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================
  // BACKEND URL
  // =====================================================
  const BACKEND_URL = "https://cfcf-182-93-68-229.ngrok-free.app";

  // =====================================================
  // IMAGE URL
  // =====================================================
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    return `${BACKEND_URL.replace(/\/$/, "")}/${imagePath.replace(/^\/+/, "")}`;
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    loadReports();
  }, []);

  // =====================================================
  // LOAD REPORTS
  // =====================================================
  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // GET ALL REPORTS
      const response = await axiosInstance.get("/problem/reports/");
      const reportsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setReports(reportsData);

      // GET VOTES FOR ALL REPORTS
      await loadAllVoteData(reportsData);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to fetch community reports from server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD VOTE DATA
  // =====================================================
  const loadAllVoteData = async (reportsData) => {
    if (!reportsData || reportsData.length === 0) return;

    const voteResults = await Promise.all(
      reportsData.map(async (report) => {
        try {
          const response = await axiosInstance.get(
            `/problem/reports/${report.id}/vote/`
          );

          return {
            id: report.id,
            data: response.data,
          };
        } catch (err) {
          console.error(
            `Failed to load vote data for report ${report.id}:`,
            err
          );

          return {
            id: report.id,
            data: {
              problem: report.id,
              vote_count: 0,
              voted: false,
              vote: null,
            },
          };
        }
      })
    );

    // CONVERT ARRAY TO OBJECT
    const newVoteData = {};
    voteResults.forEach((item) => {
      newVoteData[item.id] = item.data;
    });

    setVoteData(newVoteData);
  };

  // =====================================================
  // HANDLE VOTE
  // =====================================================
  const handleVote = async (problemId) => {
    if (votingMap[problemId]) return;

    setVotingMap((prev) => ({
      ...prev,
      [problemId]: true,
    }));

    try {
      // POST VOTE
      await axiosInstance.post(`/problem/reports/${problemId}/vote/`);

      // GET FRESH VOTE DATA
      const response = await axiosInstance.get(
        `/problem/reports/${problemId}/vote/`
      );

      setVoteData((prev) => ({
        ...prev,
        [problemId]: response.data,
      }));
    } catch (err) {
      console.error("Voting failed:", err);

      if (err.response?.status === 401) {
        alert("Please login before voting.");
      } else {
        alert("Could not register your vote.");
      }
    } finally {
      setVotingMap((prev) => ({
        ...prev,
        [problemId]: false,
      }));
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (loading) {
    return (
      <div className="gov-dashboard-wrapper">
        <Header />
        <main
          className="gov-content-area"
          style={{ minHeight: "80vh", padding: "40px" }}
        >
          <div className="gov-loader" style={{ textAlign: "center" }}>
            Loading Community Incident Feed...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="gov-dashboard-wrapper">
      <Header />

      <main
        className="gov-content-area"
        style={{ minHeight: "80vh", padding: "20px" }}
      >
        {/* HERO SECTION */}
        <div className="pub-hero-section">
          <div className="pub-hero-overlay">
            <div className="pub-hero-content">
              <h1>Community Problem Feed</h1>
              <p>
                See real-time civic issues reported across the city. Support
                shared experiences by voting on ongoing incidents like
                flooding or infrastructure damage.
              </p>
            </div>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="pub-main-container">
          {error && <div className="gov-alert error">{error}</div>}

          <div className="pub-section-header">
            <h2>Active Citizen Reports ({reports.length})</h2>
            <p>
              Experiencing the same problem? Upvote or confirm incidents to
              highlight neighborhood impact to municipal authorities.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="pub-empty-card">
              <h3>No Reports Found</h3>
              <p>There are no active public reports submitted at the moment.</p>
            </div>
          ) : (
            <div className="pub-reports-grid">
              {reports.map((report) => {
                const currentVote = voteData[report.id];
                const voteCount = currentVote?.vote_count ?? 0;
                const hasVoted = currentVote?.voted ?? false;
                const imageUrl = getImageUrl(report.image);

                return (
                  <article key={report.id} className="pub-report-card">
                    {/* IMAGE */}
                    {imageUrl && (
                      <div className="pub-card-image-wrapper">
                        <img
                          src={imageUrl}
                          alt={report.title}
                          className="pub-report-image"
                          onError={(event) => {
                            console.error("Failed to load image:", imageUrl);
                            event.currentTarget.style.display = "none";
                          }}
                        />

                        <span
                          className={`pub-severity-badge severity-${report.severity}`}
                        >
                          {report.severity
                            ? report.severity.toUpperCase()
                            : "MEDIUM"}
                        </span>
                      </div>
                    )}

                    {/* BODY */}
                    <div className="pub-card-body">
                      {/* CATEGORY & STATUS */}
                      <div className="pub-card-meta-top">
                        <span className="pub-category-tag">
                          {report.category_name || "Civic Issue"}
                        </span>

                        <span
                          className={`pub-status-badge status-${report.status}`}
                        >
                          {report.status
                            ? report.status.replace("_", " ")
                            : "pending"}
                        </span>
                      </div>

                      <h3>{report.title}</h3>
                      <p className="pub-desc">{report.description}</p>

                      {/* LOCATION */}
                      <div className="pub-location-block">
                        <span>📍 {report.location}</span>
                        {report.latitude != null && report.longitude != null && (
                          <span className="pub-gps">
                            🌍 {report.latitude}, {report.longitude}
                          </span>
                        )}
                      </div>

                      {/* FOOTER */}
                      <div className="pub-card-footer">
                        <div className="pub-author-info">
                          <small>
                            Reported by:{" "}
                            <strong>
                              {report.reported_by?.username || "Citizen"}
                            </strong>
                          </small>

                          {report.created_at && (
                            <small className="pub-date">
                              {new Date(
                                report.created_at
                              ).toLocaleDateString()}
                            </small>
                          )}
                        </div>

                        {/* VOTE BUTTON */}
                        <button
                          type="button"
                          className={
                            hasVoted ? "btn-vote-green voted" : "btn-vote-green"
                          }
                          onClick={() => handleVote(report.id)}
                          disabled={votingMap[report.id]}
                        >
                          {votingMap[report.id] ? (
                            "Voting..."
                          ) : hasVoted ? (
                            <>👍 Voted ({voteCount})</>
                          ) : (
                            <>👍 Confirm / Vote ({voteCount})</>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicReports;