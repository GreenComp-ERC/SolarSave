import React from "react";
import "../style/Footer.css";  // ✅ Import styles

const Footer = () => (
  <footer className="footer">
    {/* Brand text */}
    <div className="footer-content">
      <p className="footer-text">
        Build a sustainable future with <strong>SolarChain</strong> 🌍
      </p>
    </div>

    {/* Tagline */}
    <div className="footer-info">
      <p className="footer-text">Empowering clean energy communities worldwide.</p>
    </div>

    {/* Gradient divider */}
    <div className="footer-divider" />

    {/* Copyright */}
    <div className="footer-copyright">
      <p className="copyright-text">© 2026 SolarChain. All rights reserved.</p>
      <p className="copyright-text">All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
