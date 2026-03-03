import React from "react";
import logo from "../../images/logo.png";
import "../style/Footer.css";  // ✅ Import styles

const Footer = () => (
  <footer className="footer">
    {/* Logo + navigation links */}
    <div className="footer-content">
      <div className="logo-container">
        <img
          src={logo}
          alt="SolarSave Logo"
          className="logo hover-animate"
        />
      </div>
      <div className="nav-links">
        {["Dashboard", "Energy Data", "Rewards Center", "System Settings"].map((item, index) => (
          <p key={index} className="nav-link">
            {item}
          </p>
        ))}
      </div>
    </div>

    {/* Tagline + email */}
    <div className="footer-info">
      <p className="footer-text">
        Build a sustainable future with <strong>SolarSave</strong> 🌍
      </p>
      <p className="footer-email">info@solarsave.com</p>
    </div>

    {/* Gradient divider */}
    <div className="footer-divider" />

    {/* Copyright */}
    <div className="footer-copyright">
      <p className="copyright-text">© 2024 SolarSave. All rights reserved.</p>
      <p className="copyright-text">All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
