import React, { useState } from "react";
import "./Footer.css";

const Footer = () => {
  const [newsletter, setNewsletter] = useState({ name: "", email: "" });

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert(`Thank you for subscribing, ${newsletter.name || "Citizen"}!`);
    setNewsletter({ name: "", email: "" });
  };

  return (
    <footer className="template-footer">
      <div className="footer-stay-connected">
        <div className="stay-connected-inner">
          <h2>Stay Connected</h2>
          <form onSubmit={handleSubscribe} className="newsletter-box">
            <input
              type="text"
              placeholder="Your Name *"
              value={newsletter.name}
              onChange={(e) => setNewsletter({ ...newsletter, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Your Email *"
              value={newsletter.email}
              onChange={(e) => setNewsletter({ ...newsletter, email: e.target.value })}
              required
            />
            <button type="submit">SIGN UP</button>
          </form>
        </div>
      </div>
      <div className="footer-main-content">
        <div className="footer-grid">
          <div className="footer-col">
            <h3 className="footer-logo">HamroPal.</h3>
            <p>City Government Portal</p>
            <p>📍 Kathmandu, Bagmati Province, Nepal</p>
            <p>📞 +977 1 4000000</p>
            <p>⏰ Sun - Fri: 10:00 am. - 5:00 pm.</p>
          </div>
          <div className="footer-col">
            <h4>SERVICE REQUESTS</h4>
            <ul>
              <li>311 Requests</li>
              <li>Request a Bulk Item Pickup</li>
              <li>Report a Parking Violation</li>
              <li>Report a Pothole</li>
              <li>Report a Streetlight Outage</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>CITY MAP</h4>
            <div className="map-placeholder-box">
              <span>Interactive City Map Lookup</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <p>Copyright © 2026 HamroPal. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;