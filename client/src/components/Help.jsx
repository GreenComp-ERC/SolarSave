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
              <li>Start Hardhat node from <code>smart_contract</code>.</li>
              <li>Deploy contracts with <code>npx hardhat run scripts/deployAll.js --network localhost</code>.</li>
              <li>Start the simulator with <code>python -m uvicorn main:app --reload</code>.</li>
              <li>Start the client with <code>npm run dev</code>.</li>
              <li>Connect MetaMask to Hardhat Local, Chain ID <code>31337</code>.</li>
            </ol>
          </div>
        </section>
      );
    }

    if (activeSection === "workbench") {
      return (
        <section>
          <div className="section-header">
            <h2>Planner Workbench</h2>
          </div>
          <div className="section-content">
            <ul>
              <li><strong>Verified DER:</strong> machine-verified candidate records from the CSV.</li>
              <li><strong>Rejected FDIA:</strong> records rejected by the physics-boundary check.</li>
              <li><strong>On-chain:</strong> candidates registered as blockchain solar panels in this session.</li>
              <li><strong>Ready MW:</strong> verified, non-rejected generation available for market reasoning.</li>
            </ul>
            <p>
              Use the layer checkboxes to show or hide candidate samples, registered solar
              panels, and factory demand nodes. Use All assets/My assets to switch the
              blockchain panel and factory scope.
            </p>
          </div>
        </section>
      );
    }

    if (activeSection === "review") {
      return (
        <section>
          <div className="section-header">
            <h2>Review and Registration</h2>
          </div>
          <div className="section-content">
            <ol>
              <li>Select a record in <strong>Candidate DER Queue</strong> or click a map marker.</li>
              <li>Inspect irradiance, air temperature, <code>P_max_W</code>, reported power, and residual.</li>
              <li>Choose <strong>Reject FDIA</strong> if the record violates the physics boundary.</li>
              <li>Choose <strong>Approve & convert to solar panel</strong> to open the registration window.</li>
              <li>Confirm planner approval, then use <strong>Sign & Register</strong> to send the on-chain transaction.</li>
            </ol>
            <p>
              Rejecting a record does not open MetaMask and does not write to the chain.
              Approving a record still requires wallet signature before registration.
            </p>
          </div>
        </section>
      );
    }

    if (activeSection === "data") {
      return (
        <section>
          <div className="section-header">
            <h2>Importing Data</h2>
          </div>
          <div className="section-content">
            <p>Replace the CSV files in <code>client/public/datasets</code>, then refresh the client.</p>
            <div className="feature-card">
              <h3>DER verification data</h3>
              <p><code>spatiotemporal_generation.csv</code> should include:</p>
              <p>
                <code>timestamp,hour,node_id,city,latitude,longitude,irradiance_Wm2,air_temp_C,P_max_W,P_reported_W,fdia_detected,verification_status</code>
              </p>
            </div>
            <div className="feature-card">
              <h3>Market impact data</h3>
              <p><code>market_liquidity.csv</code> should include:</p>
              <p>
                <code>timestamp,hour,total_verified_MW,solarchain_liquidity_MW,baseline_liquidity_MW,slippage_solarchain_pct,slippage_baseline_pct</code>
              </p>
            </div>
            <p>
              The queue shows hourly samples. The map groups samples by <code>node_id</code>,
              so repeated hourly rows at the same location appear as one DER node marker.
            </p>
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
              <li><strong>Candidate DER Sample:</strong> imported evidence, not yet an asset.</li>
              <li><strong>On-chain Solar Panel:</strong> approved supply asset created by wallet-signed registration.</li>
              <li><strong>Factory Demand Node:</strong> on-chain demand asset with location and consumption.</li>
            </ul>
            <p>
              You can still right-click the map to manually create a solar panel or factory.
              Manual panel creation now passes through the same planner review window.
            </p>
          </div>
        </section>
      );
    }

    if (activeSection === "market") {
      return (
        <section>
          <div className="section-header">
            <h2>Market and Rewards</h2>
          </div>
          <div className="section-content">
            <ul>
              <li>Transactions shows global supply, demand, deficits, and factory purchase flow.</li>
              <li>Market Impact compares SolarChain liquidity with a no-split baseline.</li>
              <li>Rewards accrue after simulator market steps and follow the contract cooldown.</li>
              <li>If values are zero, ensure the simulator is running and chain assets exist.</li>
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
            <li>Candidate queue is empty: confirm CSV files exist under <code>client/public/datasets</code>.</li>
            <li>Map has fewer markers than queue rows: hourly records are grouped by <code>node_id</code>.</li>
            <li>MetaMask does not open: connect wallet and switch to the local Hardhat network.</li>
            <li>Registration fails: use a funded Hardhat account and verify contracts were deployed.</li>
            <li>Simulator API error: confirm FastAPI is running on <code>127.0.0.1:8000</code>.</li>
          </ul>
        </div>
      </section>
    );
  };

  return (
    <div className="about-overlay">
      <div className="about-modal">
        <div className="about-header">
          <h1>SolarChain Help Center</h1>
          <p className="about-subtitle">Planner verification, data import, and on-chain registration</p>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="about-content">
          <div className="about-nav">
            <button className={activeSection === "quickstart" ? "active" : ""} onClick={() => setActiveSection("quickstart")}>
              Quick Start
            </button>
            <button className={activeSection === "workbench" ? "active" : ""} onClick={() => setActiveSection("workbench")}>
              Workbench
            </button>
            <button className={activeSection === "review" ? "active" : ""} onClick={() => setActiveSection("review")}>
              Review
            </button>
            <button className={activeSection === "data" ? "active" : ""} onClick={() => setActiveSection("data")}>
              Data Import
            </button>
            <button className={activeSection === "assets" ? "active" : ""} onClick={() => setActiveSection("assets")}>
              Assets
            </button>
            <button className={activeSection === "market" ? "active" : ""} onClick={() => setActiveSection("market")}>
              Market
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
