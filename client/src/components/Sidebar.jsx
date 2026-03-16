import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Sun, List, ChevronLeft, ChevronRight, Zap, Thermometer,
  Globe, Lock, Search, ChevronsLeft, ChevronsRight, Unlock, Factory
} from "lucide-react";
import SolarPanels from "../utils/test/SolarPanels.json";
import EnergyExchange from "../utils/test/EnergyExchange.json";
import contractAddresses from "../utils/contractAddress.json";
import "../style/Sidebar.css";

const contractAddress = contractAddresses.solarPanels;
const factoryAddress = contractAddresses.factory;
const exchangeAddress = contractAddresses.energyExchange;
const FACTORY_ABI = [
  "function getAllFactories() view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])",
  "function getFactoriesOf(address user) view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])"
];
const ITEMS_PER_PAGE = 4;

const fixPanelData = (panel) => {
  let { lat, lng, batteryTemp, dcPower, acPower } = panel;
  if (lat > 90 || lng > 180 || lat < -90 || lng < -180) {
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      lat = lat / 10000;
      lng = lng / 10000;
      batteryTemp = batteryTemp / 10000;
      dcPower = dcPower / 10000;
      acPower = acPower / 10000;
    }
  }
  return { ...panel, latitude: lat, longitude: lng, batteryTemperature: batteryTemp, dcPower, acPower };
};

const fixFactoryData = (factory) => {
  let { latitude, longitude, powerConsumption } = factory;
  if (latitude > 90 || longitude > 180 || latitude < -90 || longitude < -180) {
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      latitude = latitude / 10000;
      longitude = longitude / 10000;
      powerConsumption = powerConsumption / 10000;
    }
  }
  return { ...factory, latitude, longitude, powerConsumption };
};

const normalizeEnergy = (value) => {
  if (value === null || value === undefined) return 0;
  return Math.abs(value) > 1000 ? value / 10000 : value;
};

// ---------------------------------------------------------
// REUSABLE DATAVIEW COMPONENT
// Handles rendering, searching, sorting, and pagination for any dataset
// ---------------------------------------------------------
const DataView = ({ viewType, title, allItems, myItems }) => {
  const [showMy, setShowMy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState({ field: "id", ascending: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Reset pagination when toggling All/My or searching
  useEffect(() => setCurrentPage(1), [showMy, searchTerm]);

  const filterData = (data) => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.id.toString().includes(term) || 
      item.owner.toLowerCase().includes(term) || 
      item.latitude.toString().includes(term) || 
      item.longitude.toString().includes(term)
    );
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let compareA, compareB;
      switch (sortOrder.field) {
        case 'id': 
          compareA = parseInt(a.id.toString()); 
          compareB = parseInt(b.id.toString()); 
          break;
        case 'temperature': 
          compareA = a.batteryTemperature ? parseInt(a.batteryTemperature.toString()) : 0; 
          compareB = b.batteryTemperature ? parseInt(b.batteryTemperature.toString()) : 0; 
          break;
        case 'power': 
          compareA = parseInt((viewType === 'panels' ? a.dcPower : a.powerConsumption).toString()); 
          compareB = parseInt((viewType === 'panels' ? b.dcPower : b.powerConsumption).toString()); 
          break;
        default: 
          compareA = parseInt(a.id.toString()); 
          compareB = parseInt(b.id.toString());
      }
      return sortOrder.ascending ? compareA - compareB : compareB - compareA;
    });
  };

  const currentData = showMy ? myItems : allItems;
  const filteredData = filterData(currentData);
  const sortedData = sortData(filteredData);
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const displayedData = sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSortClick = (field) => setSortOrder({ field, ascending: sortOrder.field === field ? !sortOrder.ascending : true });
  const toggleItemExpand = (id) => setExpandedItemId(expandedItemId === id ? null : id);

  return (
    <div className={`${viewType}-section`}>
      <div className="switch-controls">
        <button className={`switch-button ${!showMy ? "active" : ""}`} onClick={() => setShowMy(false)}>
          <Globe size={16} /><span>All {title}</span>
        </button>
        <button className={`switch-button ${showMy ? "active" : ""}`} onClick={() => setShowMy(true)}>
          <Lock size={16} /><span>My {title}</span>
        </button>
      </div>

      <div className="panels-header">
        <h3>{showMy ? <><Lock size={16} /> My {title}</> : <><Globe size={16} /> All {title}</>}</h3>
        <span className="panel-count">{filteredData.length} {viewType}</span>
      </div>

      {viewType === "factories" && (
        <div className="panel-controls" style={{ marginTop: "0" }}>
          <div className="panel-detail" style={{ width: "100%" }}>
            <span className="label">Energy Balance / Consumption</span>
          </div>
        </div>
      )}

      <div className="panel-controls">
        <div className="search-box">
          <Search size={14} />
          <input type="text" placeholder="Search ID, owner, location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}>×</button>}
        </div>
        <div className="sort-controls">
          <button className={`sort-button ${sortOrder.field === 'id' ? 'active' : ''}`} onClick={() => handleSortClick('id')}>
            ID {sortOrder.field === 'id' && (sortOrder.ascending ? '↑' : '↓')}
          </button>
          {viewType === 'panels' && (
            <button className={`sort-button ${sortOrder.field === 'temperature' ? 'active' : ''}`} onClick={() => handleSortClick('temperature')}>
              <Thermometer size={12} /> {sortOrder.field === 'temperature' && (sortOrder.ascending ? '↑' : '↓')}
            </button>
          )}
          <button className={`sort-button ${sortOrder.field === 'power' ? 'active' : ''}`} onClick={() => handleSortClick('power')}>
            <Zap size={12} /> {sortOrder.field === 'power' && (sortOrder.ascending ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="panel-list">
        {displayedData.length === 0 ? (
          <div className="empty-state"><List size={32} /><p>{searchTerm ? `No matching ${viewType}` : `No ${viewType} data`}</p></div>
        ) : (
          displayedData.map((item) => {
            const needsEnergy = viewType === "factories" && normalizeEnergy(item.energyBalance) < normalizeEnergy(item.powerConsumption);

            return (
            <div key={item.id.toString()} className={`panel-item ${expandedItemId === item.id.toString() ? 'expanded' : ''}`} onClick={() => toggleItemExpand(item.id.toString())}>
              <div className="panel-summary">
                <div className="panel-id"><span className="label">ID</span><span className="value">{item.id.toString()}</span></div>
                <div className="panel-metrics">
                  {viewType === 'panels' && <div className="metric"><Thermometer size={14} /><span>{item.batteryTemperature.toString()}°C</span></div>}
                  {viewType === 'panels' && (
                    <div className="metric"><Zap size={14} /><span>{item.dcPower.toString()}W</span></div>
                  )}
                  {viewType === 'factories' && (
                    <div className="metric">
                      <Zap size={14} />
                      <span>{normalizeEnergy(item.energyBalance)}W/{normalizeEnergy(item.powerConsumption)}W</span>
                    </div>
                  )}
                  {needsEnergy && (
                    <div className="metric">
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: "rgba(255, 107, 107, 0.2)",
                          color: "#ff6b6b",
                          fontSize: "11px",
                          fontWeight: "bold"
                        }}
                        title="Energy Balance below Consumption"
                      >
                        NEED ENERGY
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {expandedItemId === item.id.toString() && (
                <div className="panel-details">
                  <div className="panel-detail location"><span className="label">Location</span><span className="value">{item.latitude.toString()}°, {item.longitude.toString()}°</span></div>
                  {viewType === 'panels' ? (
                    <>
                      <div className="panel-detail"><span className="label">DC Power</span><span className="value">{item.dcPower.toString()}W</span></div>
                      <div className="panel-detail"><span className="label">AC Power</span><span className="value">{item.acPower.toString()}W</span></div>
                    </>
                  ) : (
                    <>
                      <div className="panel-detail"><span className="label">Energy Balance / Consumption</span><span className="value">{normalizeEnergy(item.energyBalance)}W/{normalizeEnergy(item.powerConsumption)}W</span></div>
                      {needsEnergy && (
                        <div className="panel-detail"><span className="label">Status</span><span className="value" style={{ color: "#ff6b6b", fontWeight: "bold" }}>Needs energy purchase</span></div>
                      )}
                    </>
                  )}
                  <div className="panel-owner" title={item.owner}><span className="label">Owner</span><span className="value">{`${item.owner.substring(0, 6)}...${item.owner.substring(item.owner.length - 4)}`}</span></div>
                </div>
              )}
            </div>
          )})
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="page-button"><ChevronsLeft size={16} /></button>
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="page-button"><ChevronLeft size={16} /></button>
          <span className="page-info">{currentPage}/{totalPages}</span>
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="page-button"><ChevronRight size={16} /></button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="page-button"><ChevronsRight size={16} /></button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// MAIN SIDEBAR COMPONENT
// ---------------------------------------------------------
const Sidebar = ({ sidebarOpen, toggleSidebar, onVisibilityChange }) => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [accountShort, setAccountShort] = useState("");
  
  // Data State
  const [panels, setPanels] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [factoryContract, setFactoryContract] = useState(null);
  const [factories, setFactories] = useState([]);
  const [myFactories, setMyFactories] = useState([]);
  const [exchangeContract, setExchangeContract] = useState(null);
  const [globalSupplyEnergy, setGlobalSupplyEnergy] = useState(0);
  const [claimableReward, setClaimableReward] = useState(null);
  const [factoryBalances, setFactoryBalances] = useState({});
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [isLocked, setIsLocked] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [activeView, setActiveView] = useState("panels");
  const [navbarHeight, setNavbarHeight] = useState(64);

  useEffect(() => {
    connectWallet();
    const navbar = document.querySelector('.navbar');
    if (navbar) setNavbarHeight(navbar.offsetHeight);
  }, []);

  useEffect(() => {
    if (account) setAccountShort(`${account.substring(0, 6)}...${account.substring(account.length - 4)}`);
  }, [account]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      showNotification("Please install MetaMask!", "error");
      return;
    }
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, SolarPanels.abi, signer);
      const factoryInstance = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
      const exchangeInstance = new ethers.Contract(exchangeAddress, EnergyExchange.abi, signer);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      setAccount(accounts[0]);
      setContract(contractInstance);
      setFactoryContract(factoryInstance);
      setExchangeContract(exchangeInstance);

      await Promise.all([
        fetchPanels(contractInstance),
        fetchMyPanels(contractInstance),
        fetchFactories(factoryInstance),
        fetchMyFactories(factoryInstance, accounts[0])
      ]);
      await refreshExchange(exchangeInstance, accounts[0]);
      showNotification("Wallet connected!");
    } catch (error) {
      console.error("Connection failed:", error);
      showNotification("Wallet connection failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPanels = async (contractInstance = contract) => {
    if (!contractInstance) return;
    try {
      const raw = await contractInstance.getAllPanels();
      const fixed = raw.map((p, idx) => fixPanelData({ id: idx + 1, owner: p.owner, lat: p.latitude.toNumber(), lng: p.longitude.toNumber(), batteryTemp: p.batteryTemperature.toNumber(), dcPower: p.dcPower.toNumber(), acPower: p.acPower.toNumber() }));
      setPanels(fixed);
    } catch (error) {
      showNotification("Failed to fetch solar panels", "error");
    }
  };

  const fetchMyPanels = async (contractInstance = contract) => {
    if (!contractInstance) return;
    try {
      const raw = await contractInstance.getMyPanels();
      const fixed = raw.map((p, idx) => fixPanelData({ id: idx + 1, owner: p.owner, lat: p.latitude.toNumber(), lng: p.longitude.toNumber(), batteryTemp: p.batteryTemperature.toNumber(), dcPower: p.dcPower.toNumber(), acPower: p.acPower.toNumber() }));
      setMyPanels(fixed);
    } catch (error) {
      showNotification("Failed to fetch user solar panels", "error");
    }
  };

  const fetchFactories = async (factoryInstance = factoryContract) => {
    if (!factoryInstance) return;
    try {
      const raw = await factoryInstance.getAllFactories();
      const fixed = raw.map((f, idx) => fixFactoryData({ id: f.id?.toNumber ? f.id.toNumber() : idx + 1, owner: f.owner, latitude: f.latitude.toNumber(), longitude: f.longitude.toNumber(), powerConsumption: f.powerConsumption.toNumber(), createdAt: f.createdAt?.toNumber ? f.createdAt.toNumber() : 0 }));
      setFactories(fixed);
      refreshFactoryBalances(fixed);
    } catch (error) {
      showNotification("Failed to fetch factories", "error");
    }
  };

  const fetchMyFactories = async (factoryInstance = factoryContract, wallet = account) => {
    if (!factoryInstance || !wallet) return;
    try {
      const raw = await factoryInstance.getFactoriesOf(wallet);
      const fixed = raw.map((f, idx) => fixFactoryData({ id: f.id?.toNumber ? f.id.toNumber() : idx + 1, owner: f.owner, latitude: f.latitude.toNumber(), longitude: f.longitude.toNumber(), powerConsumption: f.powerConsumption.toNumber(), createdAt: f.createdAt?.toNumber ? f.createdAt.toNumber() : 0 }));
      setMyFactories(fixed);
    } catch (error) {
      showNotification("Failed to fetch user factories", "error");
    }
  };

  const refreshFactoryBalances = async (exchangeInstance = exchangeContract, factoryList = factories) => {
    if (!exchangeInstance || !factoryList || factoryList.length === 0) {
      setFactoryBalances({});
      return;
    }
    try {
      const entries = await Promise.all(
        factoryList.map(async (factory) => {
          const balance = await exchangeInstance.factoryEnergyBalance(factory.id);
          return [factory.id, balance.toNumber()];
        })
      );
      setFactoryBalances(Object.fromEntries(entries));
    } catch (error) {
      console.error("Failed to refresh factory balances:", error);
    }
  };

  const refreshExchange = async (exchangeInstance = exchangeContract, wallet = account) => {
    if (!exchangeInstance || !wallet) return;
    try {
      const [supply, reward] = await Promise.all([
        exchangeInstance.globalSupplyEnergy(),
        exchangeInstance.previewPersonalReward(wallet)
      ]);
      setGlobalSupplyEnergy(supply.toNumber());
      setClaimableReward(reward);
      refreshFactoryBalances(exchangeInstance);
    } catch (error) {
      console.error("Failed to refresh exchange data:", error);
    }
  };

  const isVisible = isLocked ? sidebarOpen : isHovering;
  useEffect(() => { if (onVisibilityChange) onVisibilityChange(isVisible); }, [isVisible, onVisibilityChange]);

  useEffect(() => {
    if (!exchangeContract || !account) return;
    const poller = setInterval(() => {
      refreshExchange();
    }, 10000);
    return () => clearInterval(poller);
  }, [exchangeContract, account]);

  useEffect(() => {
    if (!exchangeContract) return;
    refreshFactoryBalances(exchangeContract, factories);
  }, [exchangeContract, factories]);

  useEffect(() => {
    const handleChainUpdate = () => {
      fetchPanels();
      fetchMyPanels();
      fetchFactories();
      fetchMyFactories();
      refreshExchange();
    };
    window.addEventListener("chainStateUpdated", handleChainUpdate);
    return () => window.removeEventListener("chainStateUpdated", handleChainUpdate);
  }, [exchangeContract, account]);

  const tabStyle = {
    display: "flex", gap: "10px", margin: "0 15px 15px", padding: "4px",
    background: "rgba(255, 255, 255, 0.86)", borderRadius: "8px"
  };
  
  const tabBtnStyle = (isActive) => ({
    flex: 1, padding: "8px 0", border: "none", borderRadius: "6px",
    background: isActive ? "rgba(37, 99, 235, 0.16)" : "transparent",
    color: isActive ? "#1d4ed8" : "#64748b",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    fontWeight: isActive ? "bold" : "normal", transition: "all 0.2s"
  });

  return (
    <>
      {!isLocked && <div className="sidebar-hover-zone" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} />}
      
      <div
        className={`cyberpunk-sidebar ${isVisible ? "open" : "closed"} ${isLocked ? "locked" : "unlocked"}`}
        style={{ top: `${navbarHeight}px`, height: `calc(100vh - ${navbarHeight}px)`, zIndex: 1000, display: "flex", flexDirection: "column" }}
        onMouseEnter={() => !isLocked && setIsHovering(true)}
        onMouseLeave={() => !isLocked && setIsHovering(false)}
      >
        {isVisible && (
          <div className="sidebar-content" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            
            <div className="account-card" style={{ marginTop: "15px" }}>
              <div className="account-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="account-icon"><Sun size={18} /></div>
                  <h2 style={{ margin: 0 }}>Account Info</h2>
                </div>
                <button
                  className="lock-toggle"
                  onClick={() => setIsLocked(!isLocked)}
                  style={{ background: "transparent", border: "none", color: isLocked ? "#1d4ed8" : "#64748b", cursor: "pointer" }}
                  title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
                >
                  {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </div>
              
              {account ? (
                <div className="account-details">
                  <div className="address"><span title={account}>{accountShort}</span></div>
                  <div className="status connected">Connected</div>
                </div>
              ) : (
                <button className="connect-button" onClick={connectWallet}>Connect Wallet</button>
              )}
            </div>

            <div style={tabStyle}>
              <button style={tabBtnStyle(activeView === "panels")} onClick={() => setActiveView("panels")}>
                <Sun size={16} /> Panels
              </button>
              <button style={tabBtnStyle(activeView === "factories")} onClick={() => setActiveView("factories")}>
                <Factory size={16} /> Factories
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}>
              {activeView === "panels" ? (
                <DataView 
                  key="panels-view"
                  viewType="panels" 
                  title="Solar Panels" 
                  allItems={panels} 
                  myItems={myPanels} 
                />
              ) : (
                <DataView 
                  key="factories-view"
                  viewType="factories" 
                  title="Factories" 
                  allItems={factories.map((factory) => ({
                    ...factory,
                    energyBalance: factoryBalances[factory.id] ?? 0
                  }))} 
                  myItems={myFactories.map((factory) => ({
                    ...factory,
                    energyBalance: factoryBalances[factory.id] ?? 0
                  }))} 
                />
              )}
            </div>
          </div>
        )}
      </div>

      {isLocked && (
        <button
          className={`sidebar-toggle-btn ${sidebarOpen ? "open" : "closed"}`}
          onClick={toggleSidebar}
          style={{ top: `${navbarHeight + 10}px`, zIndex: 1001 }}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      )}

      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}
    </>
  );
};

export default Sidebar;