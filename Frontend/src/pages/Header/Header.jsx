import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = () => {
  return (
    <header className="gov-header">
      <div className="gov-header-container">
        {/* Brand / Logo */}
        <div className="gov-logo-block">
          <Link to="/" className="gov-logo-link">
            <span className="gov-logo-text">HamroPal</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="gov-nav-links">
          <Link to="/public-reports" className="nav-item">Public Reports</Link>
          <Link to="/dashboard" className="nav-item">My Dashboard</Link>
        </nav>

        {/* Right Action Area */}
        <div className="gov-header-actions">
          <Link to="/profile" className="btn-header-action">
            Profile
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;