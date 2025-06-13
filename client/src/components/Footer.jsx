import React from "react";
import logo from "../../images/logo.png";
import "../style/Footer.css";  // ✅ 引入样式文件

const Footer = () => (
  <footer className="footer">
    {/* Logo + 导航链接 */}
    <div className="footer-content">
      <div className="logo-container">
        <img
          src={logo}
          alt="SolarSave Logo"
          className="logo hover-animate"
        />
      </div>
      <div className="nav-links">
        {["仪表盘", "能源数据", "奖励中心", "系统设置"].map((item, index) => (
          <p key={index} className="nav-link">
            {item}
          </p>
        ))}
      </div>
    </div>

    {/* 宣传语与邮箱 */}
    <div className="footer-info">
      <p className="footer-text">
        与 <strong>SolarSave</strong> 一起，共创可持续未来 🌍
      </p>
      <p className="footer-email">info@solarsave.com</p>
    </div>

    {/* 渐变分割线 */}
    <div className="footer-divider" />

    {/* 版权 */}
    <div className="footer-copyright">
      <p className="copyright-text">© 2024 SolarSave 版权所有</p>
      <p className="copyright-text">保留所有权利</p>
    </div>
  </footer>
);

export default Footer;
