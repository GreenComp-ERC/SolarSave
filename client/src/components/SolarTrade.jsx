import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import {
  FiX, FiPlusCircle, FiBarChart2, FiPieChart,
  FiTrendingUp, FiLayers, FiSun, FiWifi
} from "react-icons/fi";
import TradeScript from "./TradeConfirm";
import PanelWindows from "./PanelWindows";
import SolarPanels from "../utils/test/SolarPanels.json";
import "../style/SolarTrade.css";

const contractAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";

// This component handles the chart display using a more reliable approach
const PowerChart = ({ data, chartType }) => {
  const chartRef = useRef(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    // 加载 Google Charts 库
    if (!window.google || !window.google.charts) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      script.onload = () => {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(() => setChartLoaded(true));
      };
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    } else {
      if (!window.google.visualization) {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(() => setChartLoaded(true));
      } else {
        setChartLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (chartLoaded && chartRef.current && data && data.length > 1) {
      try {
        const dataTable = window.google.visualization.arrayToDataTable(data);

        const options = {
          title: "太阳能板输出比较",
          backgroundColor: "transparent",
          colors: ["#4CAF50", "#2952E3"],
          titleTextStyle: { color: "#ffffff", fontSize: 16 },
          hAxis: {
            title: "太阳能板",
            textStyle: { color: "#cccccc" },
            titleTextStyle: { color: "#ffffff" }
          },
          vAxis: {
            title: "功率 (W)",
            textStyle: { color: "#cccccc" },
            titleTextStyle: { color: "#ffffff" }
          },
          legend: {
            position: "top",
            textStyle: { color: "#ffffff" }
          },
          chartArea: {
            width: '80%',
            height: '70%'
          },
          animation: {
            startup: true,
            duration: 1000,
            easing: 'out'
          }
        };

        let chart;
        switch (chartType) {
          case 'BarChart':
            chart = new window.google.visualization.BarChart(chartRef.current);
            break;
          case 'LineChart':
            chart = new window.google.visualization.LineChart(chartRef.current);
            break;
          case 'PieChart':
            chart = new window.google.visualization.PieChart(chartRef.current);
            options.pieHole = 0.4;
            options.legend.position = 'right';
            break;
          case 'AreaChart':
            chart = new window.google.visualization.AreaChart(chartRef.current);
            break;
          default:
            chart = new window.google.visualization.BarChart(chartRef.current);
        }

        chart.draw(dataTable, options);
      } catch (error) {
        console.error("绘制图表时发生错误:", error);
      }
    }
  }, [chartLoaded, data, chartType]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '100%' }}>
      {!chartLoaded && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>加载图表中...</p>
        </div>
      )}
    </div>
  );
};

const SolarTrade = () => {
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [panels, setPanels] = useState([]);
  const [showTradeScript, setShowTradeScript] = useState(false);
  const [allPanels, setAllPanels] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [chartType, setChartType] = useState("BarChart");
  const [account, setAccount] = useState(null);
  const [totalDcPower, setTotalDcPower] = useState(0);
  const [totalAcPower, setTotalAcPower] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setConnectionError("请安装MetaMask钱包");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setConnectionError("");
    } catch (error) {
      console.error("钱包连接失败:", error);
      setConnectionError("钱包连接失败，请重试");
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto connect on page load
  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

  // Fetch user's solar panels
  useEffect(() => {
    const fetchMyPanels = async () => {
      if (!account) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, SolarPanels.abi, signer);

        const myPanelsData = await contract.getMyPanels();
        const fix = (v) => {
        const num = v.toNumber();
        return Math.abs(num) > 1000 ? num / 10000 : num;
      };

      const formattedPanels = myPanelsData.map((panel, index) => {
        const dc = fix(panel.dcPower);
        const ac = fix(panel.acPower);
        return {
          id: index + 1,
          name: `太阳能板 ${index + 1}`,
          lat: fix(panel.latitude),
          lng: fix(panel.longitude),
          dcPower: dc,
          acPower: ac,
          efficiency: dc > 0 ? Math.round((ac / dc) * 100) : 0
        };
});


        setAllPanels(formattedPanels);
        setPanels(formattedPanels);
      } catch (error) {
        console.error("获取用户太阳能板失败:", error);
      }
    };

    fetchMyPanels();
  }, [account]);

  // Calculate combined power stats
  useEffect(() => {
    if (panels.length > 0) {
      const dc = panels.reduce((sum, panel) => sum + panel.dcPower, 0);
      const ac = panels.reduce((sum, panel) => sum + panel.acPower, 0);

      setTotalDcPower(dc);
      setTotalAcPower(ac);

      // Prepare data for chart
      const chartData = [
        ["太阳能板", "直流功率", "交流功率"],
        ...panels.map(panel => [panel.name, panel.dcPower, panel.acPower])
      ];

      setCombinedData(chartData);
    } else {
      setTotalDcPower(0);
      setTotalAcPower(0);
      setCombinedData([["太阳能板", "直流功率", "交流功率"]]);
    }
  }, [panels]);

  // Remove panel
  const removePanel = (panelId) => {
    setPanels(panels.filter((panel) => panel.id !== panelId));
  };

  // Add panel back
  const addPanelBack = (panelId) => {
    const panelToAdd = allPanels.find((panel) => panel.id === panelId);
    if (panelToAdd && !panels.some((panel) => panel.id === panelId)) {
      setPanels([...panels, panelToAdd]);
    }
  };

  // Get chart icon based on type
  const getChartIcon = (type) => {
    switch (type) {
      case "BarChart": return <FiBarChart2 />;
      case "PieChart": return <FiPieChart />;
      case "LineChart": return <FiTrendingUp />;
      case "AreaChart": return <FiLayers />;
      default: return <FiBarChart2 />;
    }
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="solar-trade-container">
      {/* Header section with wallet status */}
      <div className="solar-trade-header">
        <div className="header-logo">
          <FiSun className="sun-icon" />
          <h1>太阳能交易平台</h1>
        </div>
        <div className="wallet-status">
          {account ? (
            <div className="wallet-connected">
              <FiWifi className="status-icon connected" />
              <span className="wallet-address">{formatAddress(account)}</span>
            </div>
          ) : (
            <button
              className="connect-button"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? "连接中..." : "连接钱包"}
            </button>
          )}
          {connectionError && <div className="connection-error">{connectionError}</div>}
        </div>
      </div>

      <div className="solar-trade-content">
        {/* Left panel with solar panel selection */}
        <div className="left-panel">
          <div className="panel-header">
            <h2>太阳能板管理</h2>
            <button
              className="trade-button"
              onClick={() => setShowTradeScript(true)}
            >
              交易能源
            </button>
          </div>

          <div className="panel-selection">
            <select
              value=""
              onChange={(e) => addPanelBack(parseInt(e.target.value))}
              className="panel-dropdown"
            >
              <option value="">添加太阳能板</option>
              {allPanels
                .filter((panel) => !panels.some((p) => p.id === panel.id))
                .map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.name}
                  </option>
                ))}
            </select>
            <FiPlusCircle className="add-icon" />
          </div>

          <div className="panel-list">
            {panels.length > 0 ? (
              panels.map((panel) => (
                <div
                  key={panel.id}
                  className={`panel-card ${selectedPanel?.id === panel.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPanel(panel)}
                >
                  <div className="panel-card-header">
                    <h3>{panel.name}</h3>
                    <button
                      className="remove-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePanel(panel.id);
                      }}
                    >
                      <FiX />
                    </button>
                  </div>
                  <div className="panel-card-body">
                    <div className="power-meters">
                      <div className="power-meter dc">
                        <div className="meter-label">直流功率</div>
                        <div className="meter-value">{panel.dcPower} W</div>
                        <div className="meter-bar">
                          <div className="meter-fill" style={{ width: `${Math.min(100, panel.dcPower / 30)}%` }}></div>
                        </div>
                      </div>
                      <div className="power-meter ac">
                        <div className="meter-label">交流功率</div>
                        <div className="meter-value">{panel.acPower} W</div>
                        <div className="meter-bar">
                          <div className="meter-fill" style={{ width: `${Math.min(100, panel.acPower / 25)}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="panel-meta">
                      <div className="panel-location">
                        <span>位置: {panel.lat.toFixed(2)}, {panel.lng.toFixed(2)}</span>
                      </div>
                      <div className="panel-efficiency">
                        <span>效率: {panel.efficiency}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-panels-message">
                <p>未选择太阳能板</p>
                <p>请从下拉菜单添加</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel with statistics and visualizations */}
        <div className="right-panel">
          <div className="stats-cards">
            <div className="stats-card dc-power">
              <div className="stats-icon">
                <FiBarChart2 />
              </div>
              <div className="stats-content">
                <h3>总直流功率</h3>
                <div className="stats-value">{totalDcPower} <span>W</span></div>
              </div>
            </div>
            <div className="stats-card ac-power">
              <div className="stats-icon">
                <FiTrendingUp />
              </div>
              <div className="stats-content">
                <h3>总交流功率</h3>
                <div className="stats-value">{totalAcPower} <span>W</span></div>
              </div>
            </div>
            <div className="stats-card efficiency">
              <div className="stats-icon">
                <FiPieChart />
              </div>
              <div className="stats-content">
                <h3>平均效率</h3>
                <div className="stats-value">
                  {totalDcPower > 0 ? Math.round((totalAcPower / totalDcPower) * 100) : 0}
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="visualization-section">
            <div className="visualization-header">
              <h2>功率可视化</h2>
              <div className="chart-selector">
                {["BarChart", "LineChart", "PieChart", "AreaChart"].map((type) => (
                  <button
                    key={type}
                    className={`chart-type-button ${chartType === type ? 'active' : ''}`}
                    onClick={() => setChartType(type)}
                    title={type.replace('Chart', ' 图表')}
                  >
                    {getChartIcon(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-container">
              {combinedData.length > 1 ? (
                <PowerChart
                  data={combinedData}
                  chartType={chartType}
                />
              ) : (
                <div className="no-data-message">
                  <p>无可视化数据</p>
                  <p>请添加太阳能板查看数据图表</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal windows */}
      {showTradeScript && <TradeScript close={() => setShowTradeScript(false)} />}
      {selectedPanel && <PanelWindows panel={selectedPanel} closeWindow={() => setSelectedPanel(null)} />}
    </div>
  );
};

export default SolarTrade;