import React, { useState } from 'react';
import '../style/About.css';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const About = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    features: false,
    techStack: false,
    installation: false,
    contracts: false,
    future: false
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  return (
    <div className="about-overlay">
      <div className="about-modal">
        <div className="about-header">
          <h1>SolarSave</h1>
          <p className="about-subtitle">Leveraging blockchain for sustainable energy optimization</p>
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
            <button
              className={activeSection === 'techStack' ? 'active' : ''}
              onClick={() => setActiveSection('techStack')}
            >
              Tech Stack
            </button>
            <button
              className={activeSection === 'installation' ? 'active' : ''}
              onClick={() => setActiveSection('installation')}
            >
              Install & Run
            </button>
            <button
              className={activeSection === 'contracts' ? 'active' : ''}
              onClick={() => setActiveSection('contracts')}
            >
              Smart Contracts
            </button>
            <button
              className={activeSection === 'future' ? 'active' : ''}
              onClick={() => setActiveSection('future')}
            >
              Future Plans
            </button>
          </div>

          <div className="about-details">
            {activeSection === 'overview' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('overview')}>
                  <h2>Overview</h2>
                  {expandedSections.overview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.overview && (
                  <div className="section-content">
                    <p><strong>SolarSave</strong> is an open-source platform focused on optimizing solar energy usage through blockchain, IoT, and AI. It lets users track solar production in real time, forecast efficiency, and encourages energy-saving behavior through a reward mechanism (SolarToken, SQC).</p>
                    <p>SolarSave is designed for individuals, communities, and organizations who want to reduce energy costs, cut carbon footprints, and join the renewable energy revolution.</p>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'features' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('features')}>
                  <h2>Key Features</h2>
                  {expandedSections.features ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.features && (
                  <div className="section-content">
                    <div className="feature-card">
                      <h3>Interactive Solar Map</h3>
                      <ul>
                        <li><strong>View and create solar panels</strong>: Users can view existing panels on the map or create new ones by selecting coordinates.</li>
                        <li><strong>Real-time status display</strong>: Shows live status (coordinates, battery temperature, DC power, AC power, and owner info).</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>Efficiency Forecasting</h3>
                      <ul>
                        <li><strong>Location-based generation forecasting</strong>: Predicts solar output efficiency for a coordinate based on historical data and weather.</li>
                        <li><strong>AI optimization tips</strong>: Provides actionable recommendations such as cleaning panels or adjusting tilt to improve efficiency.</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>Blockchain Integration</h3>
                      <ul>
                        <li><strong>Device registration</strong>: Register solar panels on-chain for transparent data management.</li>
                        <li><strong>Data submission</strong>: Submit solar production data and earn SolarToken for contributions.</li>
                        <li><strong>Ownership trading</strong>: Supports secure panel ownership transfers between users.</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>Real-time Monitoring</h3>
                      <ul>
                        <li><strong>Performance dashboard</strong>: View live generation, historical data, and forecasted efficiency.</li>
                        <li><strong>Historical data visualization</strong>: Analyze trends to make better decisions.</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>Rewards</h3>
                      <ul>
                        <li><strong>SolarToken incentives</strong>: Earn rewards for submitting energy data or optimizing usage.</li>
                        <li><strong>Wallet support</strong>: Claim rewards via Ethereum-compatible wallets like MetaMask.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'techStack' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('techStack')}>
                  <h2>Tech Stack</h2>
                  {expandedSections.techStack ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.techStack && (
                  <div className="section-content">
                    <div className="tech-table">
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Python</strong></div>
                        <div className="tech-cell">Backend simulator and data processing</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>React.js</strong></div>
                        <div className="tech-cell">Frontend UI and interactive dashboard</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Solidity</strong></div>
                        <div className="tech-cell">Smart contract development</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Hardhat</strong></div>
                        <div className="tech-cell">Blockchain development and testing</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Web3.js</strong></div>
                        <div className="tech-cell">Frontend-to-blockchain integration</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Docker</strong></div>
                        <div className="tech-cell">Deployment and containerization</div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'installation' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('installation')}>
                  <h2>Install & Run</h2>
                  {expandedSections.installation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.installation && (
                  <div className="section-content">
                    <div className="installation-step">
                      <h3>1. Clone the repo</h3>
                      <div className="code-block">
                        <code>git clone https://github.com/GreenComp-ERC/SolarSave.git</code>
                        <code>cd SolarSave</code>
                      </div>
                    </div>

                    <div className="installation-step">
                      <h3>2. Frontend setup</h3>
                      <div className="code-block">
                        <code>cd client</code>
                        <code>npm install</code>
                        <code>npm run dev</code>
                      </div>
                    </div>

                    <div className="installation-step">
                      <h3>3. Simulator setup</h3>
                      <div className="code-block">
                        <code>cd ../Simulator</code>
                        <code>pip install -r requirements.txt</code>
                        <code>python main.py</code>
                        <code># or run in terminal</code>
                        <code>uvicorn main:app --reload</code>
                      </div>
                    </div>

                    <div className="installation-step">
                      <h3>4. Smart contract deployment</h3>
                      <div className="code-block">
                        <code>cd ../smart_contract</code>
                        <code>npm install</code>
                        <code>npx hardhat run scripts/deploy.js --network ganache</code>
                        <code># (You can run each contract deploy script separately)</code>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'contracts' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('contracts')}>
                  <h2>Smart Contract Features</h2>
                  {expandedSections.contracts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.contracts && (
                  <div className="section-content">
                    <div className="contract-card">
                      <h3>SolarPanelCreate.sol</h3>
                      <ul>
                        <li><strong>createPanel</strong>: Create a new solar panel and record location, battery temperature, power, and owner.</li>
                        <li><strong>updatePanel</strong>: Allow owners to update panel data every 24 hours.</li>
                        <li><strong>getPanel</strong>: Query details for a specific panel.</li>
                      </ul>
                    </div>

                    <div className="contract-card">
                      <h3>PanelTrade.sol</h3>
                      <ul>
                        <li><strong>createPanel</strong>: Register a new solar panel with location and status details.</li>
                        <li><strong>purchasePanel</strong>: Pay tokens to purchase a panel and securely transfer ownership.</li>
                        <li><strong>updatePanel</strong>: Update panel data (owner only).</li>
                      </ul>
                    </div>

                    <div className="contract-card">
                      <h3>GiveRewards.sol</h3>
                      <ul>
                        <li><strong>registerPanel</strong>: Register panels to join the rewards program.</li>
                        <li><strong>distributeRewards</strong>: Calculate and distribute rewards based on generation data.</li>
                        <li><strong>claimRewards</strong>: Withdraw accumulated rewards to a personal wallet.</li>
                      </ul>
                    </div>

                    <div className="contract-card">
                      <h3>SolarToken.sol</h3>
                      <ul>
                        <li><strong>ERC-20 standard</strong>: Token name is SolarToken with symbol SQC.</li>
                        <li><strong>Mint tokens</strong>: The contract owner can mint new tokens for rewards.</li>
                        <li><strong>Token transfers</strong>: Users can freely transfer tokens.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'future' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('future')}>
                  <h2>Future Plans</h2>
                  {expandedSections.future ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.future && (
                  <div className="section-content">
                    <ul className="future-plans">
                      <li><strong>Machine learning integration</strong>: Improve accuracy of generation forecasts.</li>
                      <li><strong>Cross-chain support</strong>: Expand to other blockchain platforms.</li>
                      <li><strong>Solar panel marketplace</strong>: Enable trading of panel ownership and rewards.</li>
                    </ul>

                    <div className="contact-info">
                      <h3>Contact Us</h3>
                      <p><strong>Email</strong>: support@solarsave.com</p>
                      <p><strong>GitHub Issues</strong>: <a href="https://github.com/GreenComp-ERC/SolarSave.git">Submit an issue</a></p>
                    </div>

                    <div className="slogan">
                      With <strong>SolarSave</strong>, let us contribute to sustainable development together!
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        <div className="about-footer">
          <p>© 2025 SolarSave · <a href="https://github.com/GreenComp-ERC/SolarSave.git">GitHub</a> · MIT License</p>
        </div>
      </div>
    </div>
  );
};

export default About;