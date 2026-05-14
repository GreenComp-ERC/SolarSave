import React, { useState } from "react";
import { X } from "lucide-react";
import "../style/About.css";

const About = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("overview");

  const renderContent = () => {
    if (activeSection === "overview") {
      return (
        <section>
          <div className="section-header">
            <h2>Overview</h2>
          </div>
          <div className="section-content">
            <p>
              <strong>SolarChain</strong> is an urban energy decision-support system for
              verifying distributed solar generation before it becomes an on-chain asset.
              The client is organized around human-machine collaboration: the simulator
              computes physics-bounded evidence, while a planner reviews the evidence and
              signs the final registration transaction.
            </p>
            <p>
              This framing turns the dashboard into a planning workflow rather than a
              passive display. Candidate DER samples, chain-registered solar panels, factory
              demand nodes, and market impact are shown together so reviewers can trace how a
              local verification decision affects urban energy liquidity.
            </p>
          </div>
        </section>
      );
    }

    if (activeSection === "workflow") {
      return (
        <section>
          <div className="section-header">
            <h2>Human-in-the-Loop Workflow</h2>
          </div>
          <div className="section-content">
            <div className="feature-card">
              <h3>Candidate DER Sample</h3>
              <p>
                A candidate sample is an hourly solar generation record loaded from the
                research dataset. It is not yet a blockchain asset.
              </p>
            </div>
            <div className="feature-card">
              <h3>Machine Boundary Check</h3>
              <p>
                The client compares reported generation with the physics maximum
                <code> P_max_W </code> and flags risky records such as false-data injection.
              </p>
            </div>
            <div className="feature-card">
              <h3>Planner Review</h3>
              <p>
                A planner inspects irradiance, temperature, reported power, residuals, and
                nearby demand before approving or rejecting the candidate.
              </p>
            </div>
            <div className="feature-card">
              <h3>Wallet Signature and Registration</h3>
              <p>
                Approved candidates can be converted into on-chain solar panels through a
                MetaMask transaction. The transaction acts as the cryptographic registration
                proof.
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (activeSection === "data") {
      return (
        <section>
          <div className="section-header">
            <h2>Dataset and Metrics</h2>
          </div>
          <div className="section-content">
            <ul>
              <li>
                <strong>Candidate DER Samples:</strong> loaded from
                <code> client/public/datasets/spatiotemporal_generation.csv</code>.
              </li>
              <li>
                <strong>Map markers:</strong> grouped by <code>node_id</code>, so the map
                shows unique DER locations while the queue shows hourly records.
              </li>
              <li>
                <strong>Market Impact:</strong> loaded from
                <code> client/public/datasets/market_liquidity.csv</code>.
              </li>
              <li>
                <strong>Ready MW:</strong> the verified, non-rejected generation estimate
                available for market reasoning.
              </li>
            </ul>
          </div>
        </section>
      );
    }

    return (
      <section>
        <div className="section-header">
          <h2>Key Features</h2>
        </div>
        <div className="section-content">
          <div className="feature-card">
            <h3>Planner Workbench</h3>
            <ul>
              <li>Left-side controls for data layers, asset scope, and verification metrics.</li>
              <li>Separate right-side queue, review, and audit panels for operational focus.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>Verification Queue</h3>
            <ul>
              <li>Shows all hourly DER samples from the imported CSV.</li>
              <li>Highlights machine status, risk level, reported power, and physics bound.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>Audit Trail</h3>
            <ul>
              <li>Records planner approval, rejection, wallet signature, and on-chain registration.</li>
              <li>Preserves the session-level reasoning path for reviewer demonstration.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>Energy Market</h3>
            <ul>
              <li>Factory demand nodes remain separate from DER supply candidates.</li>
              <li>Market impact compares verified liquidity and baseline slippage.</li>
            </ul>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="about-overlay">
      <div className="about-modal">
        <div className="about-header">
          <h1>SolarChain</h1>
          <p className="about-subtitle">Urban DER verification with planner-signed registration</p>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="about-content">
          <div className="about-nav">
            <button className={activeSection === "overview" ? "active" : ""} onClick={() => setActiveSection("overview")}>
              Overview
            </button>
            <button className={activeSection === "workflow" ? "active" : ""} onClick={() => setActiveSection("workflow")}>
              Workflow
            </button>
            <button className={activeSection === "data" ? "active" : ""} onClick={() => setActiveSection("data")}>
              Data
            </button>
            <button className={activeSection === "features" ? "active" : ""} onClick={() => setActiveSection("features")}>
              Features
            </button>
          </div>

          <div className="about-details">{renderContent()}</div>
        </div>

        <div className="about-footer">
          <p>2026 SolarChain</p>
        </div>
      </div>
    </div>
  );
};

export default About;
