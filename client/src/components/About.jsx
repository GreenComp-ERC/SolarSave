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
          <p className="about-subtitle">利用区块链实现可持续能源优化</p>
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
              概述
            </button>
            <button
              className={activeSection === 'features' ? 'active' : ''}
              onClick={() => setActiveSection('features')}
            >
              功能亮点
            </button>
            <button
              className={activeSection === 'techStack' ? 'active' : ''}
              onClick={() => setActiveSection('techStack')}
            >
              技术栈
            </button>
            <button
              className={activeSection === 'installation' ? 'active' : ''}
              onClick={() => setActiveSection('installation')}
            >
              安装与运行
            </button>
            <button
              className={activeSection === 'contracts' ? 'active' : ''}
              onClick={() => setActiveSection('contracts')}
            >
              智能合约
            </button>
            <button
              className={activeSection === 'future' ? 'active' : ''}
              onClick={() => setActiveSection('future')}
            >
              未来计划
            </button>
          </div>

          <div className="about-details">
            {activeSection === 'overview' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('overview')}>
                  <h2>概述</h2>
                  {expandedSections.overview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.overview && (
                  <div className="section-content">
                    <p><strong>SolarSave</strong> 是一个开源平台，致力于通过区块链、物联网（IoT）和人工智能（AI）技术优化太阳能的使用。该项目允许用户实时追踪太阳能生产情况、预测效率，并通过奖励机制（SolarToken，简称 SQC）激励用户节能行为。</p>
                    <p>SolarSave 专为希望降低能源成本、减少碳足迹并参与可再生能源革命的个人、社区和机构设计。</p>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'features' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('features')}>
                  <h2>功能亮点</h2>
                  {expandedSections.features ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.features && (
                  <div className="section-content">
                    <div className="feature-card">
                      <h3>互动式太阳能地图</h3>
                      <ul>
                        <li><strong>查看和创建太阳能板</strong>：用户可以在地图上查看现有的太阳能板或通过选择坐标创建新的太阳能板。</li>
                        <li><strong>实时状态显示</strong>：展示太阳能板的实时状态（如坐标、电池温度、直流功率、交流功率和所有者信息）。</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>效率预测</h3>
                      <ul>
                        <li><strong>基于位置的发电预测</strong>：根据历史数据和天气条件，预测某个坐标的太阳能发电效率。</li>
                        <li><strong>AI 优化建议</strong>：提供清洗太阳能板、调整安装角度等具体操作建议，以提升发电效率。</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>区块链集成</h3>
                      <ul>
                        <li><strong>设备注册</strong>：将太阳能板注册到区块链，实现数据透明化管理。</li>
                        <li><strong>数据提交</strong>：提交太阳能生产数据并根据贡献赚取 SolarToken。</li>
                        <li><strong>所有权交易</strong>：支持用户之间的太阳能板所有权安全交易。</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>实时监控</h3>
                      <ul>
                        <li><strong>性能仪表盘</strong>：用户可以实时查看太阳能板的发电量、历史数据和预测效率。</li>
                        <li><strong>历史数据可视化</strong>：分析历史趋势以做出更优决策。</li>
                      </ul>
                    </div>

                    <div className="feature-card">
                      <h3>奖励机制</h3>
                      <ul>
                        <li><strong>SolarToken 激励</strong>：用户因提交能源数据或优化能源使用获得奖励。</li>
                        <li><strong>钱包支持</strong>：支持 MetaMask 等以太坊兼容钱包的奖励提取。</li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'techStack' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('techStack')}>
                  <h2>技术栈</h2>
                  {expandedSections.techStack ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.techStack && (
                  <div className="section-content">
                    <div className="tech-table">
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Python</strong></div>
                        <div className="tech-cell">后端模拟器和数据处理</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>React.js</strong></div>
                        <div className="tech-cell">前端界面和交互式仪表板</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Solidity</strong></div>
                        <div className="tech-cell">智能合约开发</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Hardhat</strong></div>
                        <div className="tech-cell">区块链开发与测试</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Web3.js</strong></div>
                        <div className="tech-cell">前端与区块链交互</div>
                      </div>
                      <div className="tech-row">
                        <div className="tech-cell"><strong>Docker</strong></div>
                        <div className="tech-cell">部署与容器化</div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'installation' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('installation')}>
                  <h2>安装与运行</h2>
                  {expandedSections.installation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.installation && (
                  <div className="section-content">
                    <div className="installation-step">
                      <h3>1. 克隆项目</h3>
                      <div className="code-block">
                        <code>git clone https://github.com/GreenComp-ERC/SolarSave.git</code>
                        <code>cd SolarSave</code>
                      </div>
                    </div>

                    <div className="installation-step">
                      <h3>2. 前端设置</h3>
                      <div className="code-block">
                        <code>cd client</code>
                        <code>npm install</code>
                        <code>npm run dev</code>
                      </div>
                    </div>

                    <div className="installation-step">
                      <h3>3. 模拟器设置</h3>
                      <div className="code-block">
                        <code>cd ../Simulator</code>
                        <code>pip install -r requirements.txt</code>
                        <code>python main.py</code>
                        <code># 或者在终端中输入</code>
                        <code>uvicorn main:app --reload</code>
                      </div>
                    </div>

                    <div className="installation-step">
                      <h3>4. 智能合约部署</h3>
                      <div className="code-block">
                        <code>cd ../smart_contract</code>
                        <code>npm install</code>
                        <code>npx hardhat run scripts/deploy.js --network ganache</code>
                        <code># (可单独运行每个智能合约对应部署文件)</code>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'contracts' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('contracts')}>
                  <h2>智能合约功能</h2>
                  {expandedSections.contracts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.contracts && (
                  <div className="section-content">
                    <div className="contract-card">
                      <h3>SolarPanelCreate.sol</h3>
                      <ul>
                        <li><strong>createPanel</strong>: 创建新的太阳能板，记录其位置、电池温度、功率以及所有者信息。</li>
                        <li><strong>updatePanel</strong>: 每24小时允许所有者更新太阳能板的数据。</li>
                        <li><strong>getPanel</strong>: 查询指定太阳能板的详细信息。</li>
                      </ul>
                    </div>

                    <div className="contract-card">
                      <h3>PanelTrade.sol</h3>
                      <ul>
                        <li><strong>createPanel</strong>: 注册新的太阳能板，包含位置描述、状态等信息。</li>
                        <li><strong>purchasePanel</strong>: 用户支付代币购买太阳能板，完成所有权的安全转移。</li>
                        <li><strong>updatePanel</strong>: 更新太阳能板的数据，仅限所有者操作。</li>
                      </ul>
                    </div>

                    <div className="contract-card">
                      <h3>GiveRewards.sol</h3>
                      <ul>
                        <li><strong>registerPanel</strong>: 注册太阳能板以参与奖励机制。</li>
                        <li><strong>distributeRewards</strong>: 根据发电数据计算并分发奖励。</li>
                        <li><strong>claimRewards</strong>: 用户提取已累积的奖励到个人钱包。</li>
                      </ul>
                    </div>

                    <div className="contract-card">
                      <h3>SolarToken.sol</h3>
                      <ul>
                        <li><strong>ERC-20 标准</strong>: 代币名称为 SolarToken，符号为 SQC。</li>
                        <li><strong>铸造代币</strong>: 合约所有者可以铸造新的代币用于奖励分发。</li>
                        <li><strong>代币转账</strong>: 用户可以自由转账代币。</li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'future' && (
              <section>
                <div className="section-header" onClick={() => toggleSection('future')}>
                  <h2>未来计划</h2>
                  {expandedSections.future ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedSections.future && (
                  <div className="section-content">
                    <ul className="future-plans">
                      <li><strong>机器学习集成</strong>: 提升发电效率预测的准确性。</li>
                      <li><strong>跨链支持</strong>: 扩展到其他区块链平台。</li>
                      <li><strong>太阳能板市场</strong>: 允许用户交易太阳能板所有权及奖励。</li>
                    </ul>

                    <div className="contact-info">
                      <h3>联系我们</h3>
                      <p><strong>邮件</strong>: support@solarsave.com</p>
                      <p><strong>GitHub Issue</strong>: <a href="https://github.com/GreenComp-ERC/SolarSave.git">提交问题</a></p>
                    </div>

                    <div className="slogan">
                      通过 <strong>SolarSave</strong>，让我们一起为可持续发展贡献力量！
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        <div className="about-footer">
          <p>© 2025 SolarSave · <a href="https://github.com/GreenComp-ERC/SolarSave.git">GitHub</a> · MIT 许可证</p>
        </div>
      </div>
    </div>
  );
};

export default About;