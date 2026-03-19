import React, { useState } from "react";
import { X } from "lucide-react";
import "../style/About.css";

const Help = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("quickstart");

  const renderContent = () => {
    if (activeSection === "quickstart") {
      return (
        <section>
          <div className="section-header">
            <h2>Quick Start</h2>
          </div>
          <div className="section-content">
            <ol>
              <li>Connect MetaMask to Hardhat Local (Chain ID 31337).</li>
              <li>Start local blockchain in smart_contract with npx hardhat node.</li>
              <li>Deploy contracts with scripts/deployAll.js on localhost network.</li>
              <li>Start Simulator with python -m uvicorn main:app --reload.</li>
              <li>Start frontend in client with npm run dev.</li>
            </ol>
          </div>
        </section>
      );
    }

    if (activeSection === "wallet") {
      return (
        <section>
          <div className="section-header">
            <h2>Wallet and SOLR</h2>
          </div>
          <div className="section-content">
            <p>Use the wallet button in the navigation bar to connect MetaMask and open your wallet panel.</p>
            <ul>
              <li>View current SOLR balance for your connected account.</li>
              <li>Transfer SOLR to another valid wallet address.</li>
              <li>Owner account can mint SOLR in local test flow.</li>
            </ul>
          </div>
        </section>
      );
    }

    if (activeSection === "assets") {
      return (
        <section>
          <div className="section-header">
            <h2>Panels and Factories</h2>
          </div>
          <div className="section-content">
            <ul>
              <li>Right click on the map to create a panel or register a factory.</li>
              <li>Panel creation uses prediction data before on-chain submission.</li>
              <li>Factory registration saves location and consumption for market matching.</li>
            </ul>
          </div>
        </section>
      );
    }

    if (activeSection === "simulator") {
      return (
        <section>
          <div className="section-header">
            <h2>Simulator and Market Step</h2>
          </div>
          <div className="section-content">
            <p>
              Simulator updates market supply, demand, and user rewards through the EnergyExchange contract.
              If market cards show zero values, first verify simulator is running and at least one panel and one factory exist.
            </p>
            <ul>
              <li>Check Simulator/.env settings including private key and enable flag.</li>
              <li>Restart simulator after env updates.</li>
            </ul>
          </div>
        </section>
      );
    }

    if (activeSection === "trading") {
      return (
        <section>
          <div className="section-header">
            <h2>Energy Trading</h2>
          </div>
          <div className="section-content">
            <ul>
              <li>Open Transactions to view global supply, demand, and deficit.</li>
              <li>Select a factory and enter purchase amount.</li>
              <li>Review estimated SOLR cost before confirming transaction.</li>
            </ul>
          </div>
        </section>
      );
    }

    if (activeSection === "rewards") {
      return (
        <section>
          <div className="section-header">
            <h2>Rewards and Cooldown</h2>
          </div>
          <div className="section-content">
            <ul>
              <li>Rewards accumulate after simulator market steps.</li>
              <li>Claims are limited by simulatorStepSeconds cooldown.</li>
              <li>If claim button shows no reward, wait for next market update cycle.</li>
            </ul>
          </div>
        </section>
      );
    }

    return (
      <section>
        <div className="section-header">
          <h2>Troubleshooting</h2>
        </div>
        <div className="section-content">
          <ul>
            <li>MetaMask not connecting: reload page and reconnect account permissions.</li>
            <li>No on-chain data: ensure contracts were deployed to localhost network.</li>
            <li>Simulator API error: verify port 8000 is available and backend started.</li>
            <li>Transaction failed: switch to funded Hardhat account and retry.</li>
          </ul>
        </div>
      </section>
    );
  };

  return (
    <div className="about-overlay">
      <div className="about-modal">
        <div className="about-header">
          <h1>SolarChain User Manual</h1>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="about-content">
          <div className="about-nav">
            <button className={activeSection === "quickstart" ? "active" : ""} onClick={() => setActiveSection("quickstart")}>
              Quick Start
            </button>
            <button className={activeSection === "wallet" ? "active" : ""} onClick={() => setActiveSection("wallet")}>
              Wallet
            </button>
            <button className={activeSection === "assets" ? "active" : ""} onClick={() => setActiveSection("assets")}>
              Assets
            </button>
            <button className={activeSection === "simulator" ? "active" : ""} onClick={() => setActiveSection("simulator")}>
              Simulator
            </button>
            <button className={activeSection === "trading" ? "active" : ""} onClick={() => setActiveSection("trading")}>
              Trading
            </button>
            <button className={activeSection === "rewards" ? "active" : ""} onClick={() => setActiveSection("rewards")}>
              Rewards
            </button>
            <button className={activeSection === "troubleshooting" ? "active" : ""} onClick={() => setActiveSection("troubleshooting")}>
              Troubleshooting
            </button>
          </div>

          <div className="about-details">{renderContent()}</div>
        </div>

        <div className="about-footer">
          <p>SolarChain Help Center</p>
        </div>
      </div>
    </div>
  );
};

export default Help;
