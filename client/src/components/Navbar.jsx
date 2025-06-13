import React, { useContext, useState, useEffect } from "react";
import { TransactionContext } from "../context/TransactionContext";
import { shortenAddress } from "../utils/shortenAddress";
import TestWallet from "./test/TestWallet";
import WalletModel from "./Wallet";
import TestStore from "./test/TestStore";
import TestPanels from "./test/TestPanels";
import "../style/Navbar.css"; // 引入新的 CSS 文件
import TestReward from "./test/TestReward"; // ✅ 引入 TestReward 组件
import About from "./About"
// 替换图标导入，使用更现代的图标
import {
  Menu, X, Sun, ChevronDown, Wallet,
  Settings, Info, BookOpen, Globe,
  ShoppingCart, Activity, User, HandCoins
} from "lucide-react";

const NavBarItem = ({ title, icon, classprops, onClick }) => (
  <li
    className={`nav-item ${classprops}`}
    onClick={onClick}
  >
    {icon}
    <span>{title}</span>
  </li>
);

const Navbar = ({ logoSize = "w-16" }) => {
  const [toggleMenu, setToggleMenu] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isTestPanelsModalOpen, setIsTestPanelsModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [toolsDropdown, setToolsDropdown] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false); // ✅ 连接钱包按钮控制
  const [isTestWalletModalOpen, setIsTestWalletModalOpen] = useState(false); // ✅ 工具栏中的“代币测试”
  const [isTestRewardModalOpen, setIsTestRewardModalOpen] = useState(false); // ✅ 奖励测试弹窗


  const { currentAccount, connectWallet } = useContext(TransactionContext);

  // 监听滚动事件，控制导航栏样式
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`cyberpunk-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-content">
        <div className="logo-section">
          <div className="logo-wrapper">
            <Sun className="logo-icon" />
            <span className="logo-text">Solar<span className="highlight">Chain</span></span>
          </div>
        </div>

        <ul className="nav-links">
          <NavBarItem title="关于" icon={<Info size={18} />} onClick={() => setIsAboutOpen(true)} />
          <NavBarItem title="博客" icon={<BookOpen size={18} />} />
          <NavBarItem title="通讯" icon={<Activity size={18} />} />
          <NavBarItem title="文档" icon={<BookOpen size={18} />} />
          <NavBarItem title="区块浏览器" icon={<Globe size={18} />} />

          <li className="nav-item dropdown">
            <div
              className="dropdown-trigger"
              onClick={() => setToolsDropdown(!toolsDropdown)}
            >
              <Settings size={18} />
              <span>测试工具</span>
              <ChevronDown
                size={14}
                className={`dropdown-arrow ${toolsDropdown ? "active" : ""}`}
              />
            </div>

            {toolsDropdown && (
                <ul className="dropdown-menu">
                  <li onClick={() => {
                    setIsTokenModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <Wallet size={16}/>
                    <span>代币测试</span>
                  </li>
                  <li onClick={() => {
                    setIsStoreModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <ShoppingCart size={16}/>
                    <span>商店测试</span>
                  </li>
                  <li onClick={() => {
                    setIsTestPanelsModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <Activity size={16}/>
                    <span>太阳能板测试</span>
                  </li>
                  <li onClick={() => {
                    setIsTestRewardModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <HandCoins size={16}/>
                    <span>奖励测试</span>
                  </li>

                </ul>
            )}
          </li>
        </ul>

        <div className="wallet-section">
          {!currentAccount ? (
              <button className="connect-wallet-btn" onClick={connectWallet}>
              <Wallet size={18} />
              <span>连接钱包</span>
            </button>
          ) : (
            <button
              className="wallet-address-btn"
              onClick={() => setIsWalletModalOpen(true)}
            >
              <User size={18} />
              <span>{shortenAddress(currentAccount)}</span>
            </button>
          )}
        </div>

        <div className="mobile-menu-btn" onClick={() => setToggleMenu(!toggleMenu)}>
          {toggleMenu ? <X size={24} /> : <Menu size={24} />}
        </div>
      </div>

      {toggleMenu && (
        <div className="mobile-nav">
          <ul className="mobile-nav-list">
            <NavBarItem title="关于" icon={<Info size={18} />} onClick={() => setIsAboutOpen(true)} />
            <NavBarItem title="博客" icon={<BookOpen size={18} />} />
            <NavBarItem title="通讯" icon={<Activity size={18} />} />
            <NavBarItem title="文档" icon={<BookOpen size={18} />} />
            <NavBarItem title="区块浏览器" icon={<Globe size={18} />} />

            <li onClick={() => {
              setIsTestWalletModalOpen(true);  // ✅ 打开的是测试钱包
              setToolsDropdown(false);
            }}>
              <Wallet size={18}/>
              <span>代币测试</span>
            </li>
            <li className="mobile-nav-item" onClick={() => setIsStoreModalOpen(true)}>
            <ShoppingCart size={18} />
              <span>商店测试</span>
            </li>
            <li className="mobile-nav-item" onClick={() => setIsTestPanelsModalOpen(true)}>
              <Activity size={18} />
              <span>交易测试</span>
            </li>

            {!currentAccount && (
              <li className="mobile-connect-wallet">
                <button onClick={connectWallet}>
                  <WalletModel size={18} />
                  <span>连接钱包</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Modals */}
      {isTokenModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button
              className="modal-close-btn"
              onClick={() => setIsTokenModalOpen(false)}
            >
              <X size={20} />
            </button>
            <TestWallet />
          </div>
        </div>
      )}

      {isStoreModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container large">
            <button
              className="modal-close-btn"
              onClick={() => setIsStoreModalOpen(false)}
            >
              <X size={20} />
            </button>
            <TestStore />
          </div>
        </div>
      )}
      {isWalletModalOpen && (
    <div className="modal-overlay">
      <div className="modal-container">
        <button
          className="modal-close-btn"
          onClick={() => setIsWalletModalOpen(false)}
        >
          <X size={20} />
        </button>
        <WalletModel /> {/* ✅ Wallet.jsx */}
      </div>
    </div>
  )}


      {isTestPanelsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container large">
            <button
              className="modal-close-btn"
              onClick={() => setIsTestPanelsModalOpen(false)}
            >
              <X size={20} />
            </button>
            <TestPanels />
          </div>
        </div>
      )}
      {isAboutOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="modal-close-btn" onClick={() => setIsAboutOpen(false)}>
              <X size={20} />
            </button>
            <About />
          </div>
        </div>
      )}
      {isTestRewardModalOpen && (
  <div className="modal-overlay">
    <div className="modal-container large">
      <button
        className="modal-close-btn"
        onClick={() => setIsTestRewardModalOpen(false)}
      >
        <X size={20} />
      </button>
      <TestReward />
    </div>
  </div>
)}

    </nav>
  );
};

export default Navbar;