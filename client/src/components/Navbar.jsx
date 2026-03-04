import React, { useContext, useState, useEffect } from "react";
import { TransactionContext } from "../context/TransactionContext";
import { shortenAddress } from "../utils/shortenAddress";
import TestWallet from "./test/TestWallet";
import WalletModel from "./Wallet";
import TestStore from "./test/TestStore";
import TestPanels from "./test/TestPanels";
import "../style/Navbar.css"; // Import CSS
import TestReward from "./test/TestReward"; // ✅ Import TestReward component
import About from "./About"
// Replace icon imports with more modern icons
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
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false); // ✅ Connect wallet modal
  const [isTestRewardModalOpen, setIsTestRewardModalOpen] = useState(false); // ✅ Reward test modal


  const { currentAccount, connectWallet } = useContext(TransactionContext);

  // Listen to scroll events to update navbar styles
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
    <>
      <nav className={`cyberpunk-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-content">
        <div className="logo-section">
          <div className="logo-wrapper">
            <Sun className="logo-icon" />
            <span className="logo-text">Solar<span className="highlight">Chain</span></span>
          </div>
        </div>

        <ul className="nav-links">
          <NavBarItem title="About" icon={<Info size={18} />} onClick={() => setIsAboutOpen(true)} />
          <NavBarItem title="Blog" icon={<BookOpen size={18} />} />
          <NavBarItem title="Updates" icon={<Activity size={18} />} />
          <NavBarItem title="Docs" icon={<BookOpen size={18} />} />
          <NavBarItem title="Block Explorer" icon={<Globe size={18} />} />

          <li className="nav-item dropdown">
            <div
              className="dropdown-trigger"
              onClick={() => setToolsDropdown(!toolsDropdown)}
            >
              <Settings size={18} />
              <span>Test Tools</span>
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
                    <span>Token Test</span>
                  </li>
                  <li onClick={() => {
                    setIsStoreModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <ShoppingCart size={16}/>
                    <span>Shop Test</span>
                  </li>
                  <li onClick={() => {
                    setIsTestPanelsModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <Activity size={16}/>
                    <span>Solar Panel Test</span>
                  </li>
                  <li onClick={() => {
                    setIsTestRewardModalOpen(true);
                    setToolsDropdown(false);
                  }}>
                    <HandCoins size={16}/>
                    <span>Rewards Test</span>
                  </li>

                </ul>
            )}
          </li>
        </ul>

        <div className="wallet-section">
          {!currentAccount ? (
              <button className="connect-wallet-btn" onClick={connectWallet}>
              <Wallet size={18} />
              <span>Connect Wallet</span>
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
            <NavBarItem title="About" icon={<Info size={18} />} onClick={() => setIsAboutOpen(true)} />
            <NavBarItem title="Blog" icon={<BookOpen size={18} />} />
            <NavBarItem title="Updates" icon={<Activity size={18} />} />
            <NavBarItem title="Docs" icon={<BookOpen size={18} />} />
            <NavBarItem title="Block Explorer" icon={<Globe size={18} />} />

            <li onClick={() => {
              setIsTokenModalOpen(true);
              setToolsDropdown(false);
            }}>
              <Wallet size={18}/>
              <span>Token Test</span>
            </li>
            <li className="mobile-nav-item" onClick={() => setIsStoreModalOpen(true)}>
            <ShoppingCart size={18} />
              <span>Shop Test</span>
            </li>
            <li className="mobile-nav-item" onClick={() => setIsTestPanelsModalOpen(true)}>
              <Activity size={18} />
              <span>Trade Test</span>
            </li>

            {!currentAccount && (
              <li className="mobile-connect-wallet">
                <button onClick={connectWallet}>
                  <WalletModel size={18} />
                  <span>Connect Wallet</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      </nav>

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
        <About onClose={() => setIsAboutOpen(false)} />
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
    </>
  );
};

export default Navbar;