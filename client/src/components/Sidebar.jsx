import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Sun, List, ChevronLeft, ChevronRight, Zap, Thermometer,
  Globe, Lock, PlusCircle, Search, Filter, ChevronsLeft,
  ChevronsRight, ArrowUpDown
} from "lucide-react";
import SolarPanels from "../utils/test/SolarPanels.json";
import "../style/Sidebar.css";

const contractAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";
const PANELS_PER_PAGE = 4; // Panels per page
// Normalize panel location and power values
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

  return {
    ...panel,
    latitude: lat,
    longitude: lng,
    batteryTemperature: batteryTemp,
    dcPower,
    acPower,
  };
};


const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState("");
    const [accountShort, setAccountShort] = useState("");
    const [panels, setPanels] = useState([]);
    const [myPanels, setMyPanels] = useState([]);
    const [showMyPanels, setShowMyPanels] = useState(false);
    const [newPanel, setNewPanel] = useState({ lat: "", lng: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    // Search and filter
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState({ field: "id", ascending: true });
    const [expandedPanelId, setExpandedPanelId] = useState(null);

    // Get navbar height to calculate sidebar offset
    const [navbarHeight, setNavbarHeight] = useState(64); // Default value

    useEffect(() => {
        connectWallet();

        // Get actual navbar height
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            setNavbarHeight(navbar.offsetHeight);
        }
    }, []);

    useEffect(() => {
        if (account) {
            setAccountShort(`${account.substring(0, 6)}...${account.substring(account.length - 4)}`);
        }
    }, [account]);

    // Reset page when view changes
    useEffect(() => {
        setCurrentPage(1);
    }, [showMyPanels, searchTerm]);

    const showNotification = (message, type = "success") => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: "", type: "" });
        }, 3000);
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

            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);
            setContract(contractInstance);

            await Promise.all([
                fetchPanels(contractInstance),
                fetchMyPanels(contractInstance)
            ]);

            showNotification("Wallet connected!");
        } catch (error) {
            console.error("Connection failed:", error);
            showNotification("Wallet connection failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const createPanel = async () => {
        if (!contract) return showNotification("Contract not connected", "error");
        if (!newPanel.lat || !newPanel.lng) return showNotification("Please enter latitude and longitude", "error");

        try {
            setIsLoading(true);
            const tx = await contract.createPanel(newPanel.lat, newPanel.lng, 30, 1000, 900);
            await tx.wait();
            showNotification("🌞 Solar panel created!");
            setNewPanel({ lat: "", lng: "" });
            await Promise.all([fetchPanels(contract), fetchMyPanels(contract)]);
        } catch (error) {
            console.error("Creation failed:", error);
            showNotification("❌ Solar panel creation failed!", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPanels = async (contractInstance = contract) => {
  if (!contractInstance) return;

  try {
        const raw = await contractInstance.getAllPanels();
        const fixed = raw.map((p, idx) =>
  fixPanelData({
    id: idx + 1,
    owner: p.owner,
    lat: p.latitude.toNumber(),
    lng: p.longitude.toNumber(),
    batteryTemp: p.batteryTemperature.toNumber(),
    dcPower: p.dcPower.toNumber(),
    acPower: p.acPower.toNumber(),
  })
);

    setPanels(fixed);
  } catch (error) {
    console.error("❌ Failed to fetch all solar panels:", error);
    showNotification("Failed to fetch solar panels", "error");
  }
};


    const fetchMyPanels = async (contractInstance = contract) => {
  if (!contractInstance) return;

  try {
    const raw = await contractInstance.getMyPanels();
    const fixed = raw.map((p, idx) =>
  fixPanelData({
    id: idx + 1,
    owner: p.owner,
    lat: p.latitude.toNumber(),
    lng: p.longitude.toNumber(),
    batteryTemp: p.batteryTemperature.toNumber(),
    dcPower: p.dcPower.toNumber(),
    acPower: p.acPower.toNumber(),
  })
);


    setMyPanels(fixed);
  } catch (error) {
    console.error("❌ Failed to fetch user solar panels:", error);
    showNotification("Failed to fetch user solar panels", "error");
  }
};


    // Filter panels
    const filterPanels = (panelsData) => {
        if (!searchTerm) return panelsData;

        return panelsData.filter(panel =>
            panel.id.toString().includes(searchTerm) ||
            panel.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            panel.latitude.toString().includes(searchTerm) ||
            panel.longitude.toString().includes(searchTerm)
        );
    };

    // Sort panels
    const sortPanels = (panelsData) => {
        return [...panelsData].sort((a, b) => {
            let compareA, compareB;

            switch (sortOrder.field) {
                case 'id':
                    compareA = parseInt(a.id.toString());
                    compareB = parseInt(b.id.toString());
                    break;
                case 'temperature':
                    compareA = parseInt(a.batteryTemperature.toString());
                    compareB = parseInt(b.batteryTemperature.toString());
                    break;
                case 'power':
                    compareA = parseInt(a.dcPower.toString());
                    compareB = parseInt(b.dcPower.toString());
                    break;
                default:
                    compareA = a.id.toString();
                    compareB = b.id.toString();
            }

            if (sortOrder.ascending) {
                return compareA - compareB;
            } else {
                return compareB - compareA;
            }
        });
    };

    // Handle sort click
    const handleSortClick = (field) => {
        if (sortOrder.field === field) {
            setSortOrder({ field, ascending: !sortOrder.ascending });
        } else {
            setSortOrder({ field, ascending: true });
        }
    };

    // Pagination controls
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Prepare panels to display
    const currentData = showMyPanels ? myPanels : panels;
    const filteredData = filterPanels(currentData);
    const sortedData = sortPanels(filteredData);

    const totalPages = Math.ceil(sortedData.length / PANELS_PER_PAGE);
    const indexOfLastPanel = currentPage * PANELS_PER_PAGE;
    const indexOfFirstPanel = indexOfLastPanel - PANELS_PER_PAGE;
    const currentPanels = sortedData.slice(indexOfFirstPanel, indexOfLastPanel);

    // Expand and collapse panel details
    const togglePanelExpand = (id) => {
        if (expandedPanelId === id) {
            setExpandedPanelId(null);
        } else {
            setExpandedPanelId(id);
        }
    };

    return (
        <>
            <div
                className={`cyberpunk-sidebar ${sidebarOpen ? "open" : "closed"}`}
                style={{
                    top: `${navbarHeight}px`,
                    height: `calc(100vh - ${navbarHeight}px)`,
                    zIndex: 1000
                }}
            >
                {sidebarOpen && (
                    <div className="sidebar-content">
                        <div className="sidebar-header">
                            <div className="logo-container">
                                <Sun className="sun-icon" size={24} />
                                <h1>Solar<span>Chain</span></h1>
                            </div>
                        </div>

                        <div className="account-card">
                            <div className="account-header">
                                <div className="account-icon">
                                    <Sun size={18} />
                                </div>
                                <h2>Account Info</h2>
                            </div>
                            {account ? (
                                <div className="account-details">
                                    <div className="address">
                                        <span title={account}>{accountShort}</span>
                                    </div>
                                    <div className="status connected">Connected</div>
                                </div>
                            ) : (
                                <button className="connect-button" onClick={connectWallet}>
                                    Connect Wallet
                                </button>
                            )}
                        </div>

                        <div className="create-panel-card">
                            <div className="card-header">
                                <PlusCircle size={18} />
                                <h3>Create Solar Panel</h3>
                            </div>
                            <div className="form-group">
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="Latitude"
                                        value={newPanel.lat}
                                        onChange={(e) => setNewPanel({ ...newPanel, lat: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="Longitude"
                                        value={newPanel.lng}
                                        onChange={(e) => setNewPanel({ ...newPanel, lng: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                className={`create-button ${isLoading ? "loading" : ""}`}
                                onClick={createPanel}
                                disabled={isLoading}
                            >
                                {isLoading ? "Processing..." : "Create Solar Panel"}
                            </button>
                        </div>

                        <div className="switch-controls">
                            <button
                                className={`switch-button ${!showMyPanels ? "active" : ""}`}
                                onClick={() => setShowMyPanels(false)}
                            >
                                <Globe size={16} />
                                <span>All Panels</span>
                            </button>
                            <button
                                className={`switch-button ${showMyPanels ? "active" : ""}`}
                                onClick={() => setShowMyPanels(true)}
                            >
                                <Lock size={16} />
                                <span>My Panels</span>
                            </button>
                        </div>

                        <div className="panels-section">
                            <div className="panels-header">
                                <h3>
                                    {showMyPanels ? (
                                        <><Lock size={16} /> My Solar Panels</>
                                    ) : (
                                        <><Globe size={16} /> All Solar Panels</>
                                    )}
                                </h3>
                                <span className="panel-count">
                                    {filteredData.length} panels
                                </span>
                            </div>

                            {/* Search and filter */}
                            <div className="panel-controls">
                                <div className="search-box">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search panel ID, location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            className="clear-search"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                <div className="sort-controls">
                                    <button
                                        className={`sort-button ${sortOrder.field === 'id' ? 'active' : ''}`}
                                        onClick={() => handleSortClick('id')}
                                        title="Sort by ID"
                                    >
                                        ID {sortOrder.field === 'id' && (sortOrder.ascending ? '↑' : '↓')}
                                    </button>
                                    <button
                                        className={`sort-button ${sortOrder.field === 'temperature' ? 'active' : ''}`}
                                        onClick={() => handleSortClick('temperature')}
                                        title="Sort by temperature"
                                    >
                                        <Thermometer size={12} /> {sortOrder.field === 'temperature' && (sortOrder.ascending ? '↑' : '↓')}
                                    </button>
                                    <button
                                        className={`sort-button ${sortOrder.field === 'power' ? 'active' : ''}`}
                                        onClick={() => handleSortClick('power')}
                                        title="Sort by power"
                                    >
                                        <Zap size={12} /> {sortOrder.field === 'power' && (sortOrder.ascending ? '↑' : '↓')}
                                    </button>
                                </div>
                            </div>

                            <div className="panel-list">
                                {currentPanels.length === 0 ? (
                                    <div className="empty-state">
                                        <List size={32} />
                                        <p>
                                            {searchTerm ? 'No matching solar panels' : 'No solar panel data'}
                                        </p>
                                    </div>
                                ) : (
                                    currentPanels.map((panel) => (
                                        <div
                                            key={panel.id.toString()}
                                            className={`panel-item ${expandedPanelId === panel.id.toString() ? 'expanded' : ''}`}
                                            onClick={() => togglePanelExpand(panel.id.toString())}
                                        >
                                            <div className="panel-summary">
                                                <div className="panel-id">
                                                    <span className="label">ID</span>
                                                    <span className="value">{panel.id.toString()}</span>
                                                </div>
                                                <div className="panel-metrics">
                                                    <div className="metric">
                                                        <Thermometer size={14} />
                                                        <span>{panel.batteryTemperature.toString()}°C</span>
                                                    </div>
                                                    <div className="metric">
                                                        <Zap size={14} />
                                                        <span>{panel.dcPower.toString()}W</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedPanelId === panel.id.toString() && (
                                                <div className="panel-details">
                                                    <div className="panel-detail location">
                                                        <span className="label">Location</span>
                                                        <span className="value">{panel.latitude.toString()}°, {panel.longitude.toString()}°</span>
                                                    </div>
                                                    <div className="panel-detail">
                                                        <span className="label">DC Power</span>
                                                        <span className="value">{panel.dcPower.toString()}W</span>
                                                    </div>
                                                    <div className="panel-detail">
                                                        <span className="label">AC Power</span>
                                                        <span className="value">{panel.acPower.toString()}W</span>
                                                    </div>
                                                    <div className="panel-owner" title={panel.owner}>
                                                        <span className="label">Owner</span>
                                                        <span className="value">{`${panel.owner.substring(0, 6)}...${panel.owner.substring(panel.owner.length - 4)}`}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="page-button"
                                        title="First page"
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="page-button"
                                        title="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <span className="page-info">{currentPage}/{totalPages}</span>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="page-button"
                                        title="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="page-button"
                                        title="Last page"
                                    >
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button
                className={`sidebar-toggle-btn ${sidebarOpen ? "open" : "closed"}`}
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                style={{
                    top: `${navbarHeight + 10}px`,
                    zIndex: 1001
                }}
            >
                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            {notification.show && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
        </>
    );
};

export default Sidebar;