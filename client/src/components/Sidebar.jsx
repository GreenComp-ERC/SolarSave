import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Sun, List, ChevronLeft, ChevronRight, Zap, Thermometer,
  Globe, Lock, PlusCircle, Search, Filter, ChevronsLeft,
  ChevronsRight, ArrowUpDown
} from "lucide-react";
import SolarPanels from "../utils/SolarPanels.json";
import "../style/Sidebar.css";

const contractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9";
const PANELS_PER_PAGE = 2; // 每页显示的面板数量

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

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    // 搜索和过滤
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState({ field: "id", ascending: true });
    const [expandedPanelId, setExpandedPanelId] = useState(null);

    // 获取导航栏高度来计算侧边栏的顶部偏移
    const [navbarHeight, setNavbarHeight] = useState(64); // 默认值

    useEffect(() => {
        connectWallet();

        // 获取实际的navbar高度
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

    // 重置页码当视图改变时
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
            showNotification("请安装 MetaMask!", "error");
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

            showNotification("钱包连接成功！");
        } catch (error) {
            console.error("连接失败:", error);
            showNotification("钱包连接失败", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const createPanel = async () => {
        if (!contract) return showNotification("未连接合约", "error");
        if (!newPanel.lat || !newPanel.lng) return showNotification("请输入经纬度", "error");

        try {
            setIsLoading(true);
            const tx = await contract.createPanel(newPanel.lat, newPanel.lng, 30, 1000, 900);
            await tx.wait();
            showNotification("🌞 太阳能板创建成功!");
            setNewPanel({ lat: "", lng: "" });
            await Promise.all([fetchPanels(contract), fetchMyPanels(contract)]);
        } catch (error) {
            console.error("创建失败:", error);
            showNotification("❌ 太阳能板创建失败！", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;

        try {
            const allPanels = await contractInstance.getAllPanels();
            setPanels(allPanels);
        } catch (error) {
            console.error("❌ 获取所有太阳能板失败:", error);
            showNotification("获取太阳能板失败", "error");
        }
    };

    const fetchMyPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;

        try {
            const myPanelsData = await contractInstance.getMyPanels();
            setMyPanels(myPanelsData);
        } catch (error) {
            console.error("❌ 获取用户太阳能板失败:", error);
            showNotification("获取用户太阳能板失败", "error");
        }
    };

    // 过滤面板
    const filterPanels = (panelsData) => {
        if (!searchTerm) return panelsData;

        return panelsData.filter(panel =>
            panel.id.toString().includes(searchTerm) ||
            panel.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            panel.latitude.toString().includes(searchTerm) ||
            panel.longitude.toString().includes(searchTerm)
        );
    };

    // 排序面板
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

    // 处理排序点击
    const handleSortClick = (field) => {
        if (sortOrder.field === field) {
            setSortOrder({ field, ascending: !sortOrder.ascending });
        } else {
            setSortOrder({ field, ascending: true });
        }
    };

    // 分页控制
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // 准备显示的面板
    const currentData = showMyPanels ? myPanels : panels;
    const filteredData = filterPanels(currentData);
    const sortedData = sortPanels(filteredData);

    const totalPages = Math.ceil(sortedData.length / PANELS_PER_PAGE);
    const indexOfLastPanel = currentPage * PANELS_PER_PAGE;
    const indexOfFirstPanel = indexOfLastPanel - PANELS_PER_PAGE;
    const currentPanels = sortedData.slice(indexOfFirstPanel, indexOfLastPanel);

    // 展开和收缩面板详情
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
                                <h2>账户信息</h2>
                            </div>
                            {account ? (
                                <div className="account-details">
                                    <div className="address">
                                        <span title={account}>{accountShort}</span>
                                    </div>
                                    <div className="status connected">已连接</div>
                                </div>
                            ) : (
                                <button className="connect-button" onClick={connectWallet}>
                                    连接钱包
                                </button>
                            )}
                        </div>

                        <div className="create-panel-card">
                            <div className="card-header">
                                <PlusCircle size={18} />
                                <h3>创建太阳能板</h3>
                            </div>
                            <div className="form-group">
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="纬度"
                                        value={newPanel.lat}
                                        onChange={(e) => setNewPanel({ ...newPanel, lat: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="经度"
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
                                {isLoading ? "处理中..." : "创建太阳能板"}
                            </button>
                        </div>

                        <div className="switch-controls">
                            <button
                                className={`switch-button ${!showMyPanels ? "active" : ""}`}
                                onClick={() => setShowMyPanels(false)}
                            >
                                <Globe size={16} />
                                <span>所有面板</span>
                            </button>
                            <button
                                className={`switch-button ${showMyPanels ? "active" : ""}`}
                                onClick={() => setShowMyPanels(true)}
                            >
                                <Lock size={16} />
                                <span>我的面板</span>
                            </button>
                        </div>

                        <div className="panels-section">
                            <div className="panels-header">
                                <h3>
                                    {showMyPanels ? (
                                        <><Lock size={16} /> 我的太阳能板</>
                                    ) : (
                                        <><Globe size={16} /> 所有太阳能板</>
                                    )}
                                </h3>
                                <span className="panel-count">
                                    {filteredData.length}个
                                </span>
                            </div>

                            {/* 搜索和筛选 */}
                            <div className="panel-controls">
                                <div className="search-box">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="搜索面板ID、位置..."
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
                                        title="按ID排序"
                                    >
                                        ID {sortOrder.field === 'id' && (sortOrder.ascending ? '↑' : '↓')}
                                    </button>
                                    <button
                                        className={`sort-button ${sortOrder.field === 'temperature' ? 'active' : ''}`}
                                        onClick={() => handleSortClick('temperature')}
                                        title="按温度排序"
                                    >
                                        <Thermometer size={12} /> {sortOrder.field === 'temperature' && (sortOrder.ascending ? '↑' : '↓')}
                                    </button>
                                    <button
                                        className={`sort-button ${sortOrder.field === 'power' ? 'active' : ''}`}
                                        onClick={() => handleSortClick('power')}
                                        title="按功率排序"
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
                                            {searchTerm ? '没有匹配的太阳能板' : '暂无太阳能板数据'}
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
                                                        <span className="label">位置</span>
                                                        <span className="value">{panel.latitude.toString()}°, {panel.longitude.toString()}°</span>
                                                    </div>
                                                    <div className="panel-detail">
                                                        <span className="label">DC功率</span>
                                                        <span className="value">{panel.dcPower.toString()}W</span>
                                                    </div>
                                                    <div className="panel-detail">
                                                        <span className="label">AC功率</span>
                                                        <span className="value">{panel.acPower.toString()}W</span>
                                                    </div>
                                                    <div className="panel-owner" title={panel.owner}>
                                                        <span className="label">所有者</span>
                                                        <span className="value">{`${panel.owner.substring(0, 6)}...${panel.owner.substring(panel.owner.length - 4)}`}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* 分页控件 */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="page-button"
                                        title="第一页"
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="page-button"
                                        title="上一页"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <span className="page-info">{currentPage}/{totalPages}</span>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="page-button"
                                        title="下一页"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="page-button"
                                        title="最后一页"
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
                aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
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