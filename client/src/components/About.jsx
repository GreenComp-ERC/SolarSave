import React, { useState } from 'react';
import '../style/About.css';
import { X } from 'lucide-react';

const About = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    if (activeSection === 'overview') {
      return (
        <section>
          <div className="section-header">
            <h2>Overview</h2>
          </div>
          <div className="section-content">
            <p>
              <strong>SolarChain</strong> is an open-source platform for optimizing distributed
              solar energy with blockchain, geospatial interaction, and AI-powered forecasting.
              It combines on-chain asset management, factory-side energy demand, and a
              simulator-driven market update flow.
            </p>
            <p>
              SolarChain is designed for individuals, communities, and organizations that want
              transparent energy data, tokenized incentives, and a practical local testbed for
              renewable energy coordination.
            </p>
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
            <h3>Interactive Map and Asset Creation</h3>
            <ul>
              <li>Solar panel registration from map coordinates.</li>
              <li>Factory registration with location and power consumption.</li>
              <li>Global and personal asset discovery via map interaction.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>AI-Assisted Generation Forecast</h3>
            <ul>
              <li>Prediction API integration for battery temperature, DC power, and AC power.</li>
              <li>Pre-submission prediction display before panel confirmation.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>On-Chain Energy Market</h3>
            <ul>
              <li>Tracks global supply and demand energy on-chain.</li>
              <li>Supports factory energy purchase with SOLR cost preview.</li>
              <li>Displays factory energy balances and deficit conditions.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>Rewards and Wallet</h3>
            <ul>
              <li>Personal rewards accrue from simulator market steps.</li>
              <li>Reward claim cooldown follows contract simulator step settings.</li>
              <li>MetaMask wallet integration and SOLR transfer support.</li>
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
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="about-content">
          <div className="about-nav">
            <button
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={() => setActiveSection('overview')}
            >
              Overview
            </button>
            <button
              className={activeSection === 'features' ? 'active' : ''}
              onClick={() => setActiveSection('features')}
            >
              Key Features
            </button>
          </div>

          <div className="about-details">{renderContent()}</div>
        </div>

        <div className="about-footer">
          <p>© 2026 SolarChain</p>
        </div>
      </div>
    </div>
  );
};

export default About;