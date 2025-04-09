import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Sun, List, ChevronLeft, ChevronRight, Zap, Thermometer, Globe, Lock, PlusCircle } from "lucide-react";
import SolarPanels from "../utils/SolarPanels.json";
import "../style/Sidebar.css";

const contractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9";

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

    return (
        <>
            <div
                className={`cyberpunk-sidebar ${sidebarOpen ? "open" : "closed"}`}
                style={{
                    top: `${navbarHeight}px`,
                    height: `calc(100vh - ${navbarHeight}px)`,
                    zIndex: 1000 // 确保低于navbar的z-index
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
                                    {(showMyPanels ? myPanels.length : panels.length)}个
                                </span>
                            </div>

                            <div className="panel-list">
                                {(showMyPanels ? myPanels : panels).length === 0 ? (
                                    <div className="empty-state">
                                        <List size={32} />
                                        <p>暂无太阳能板数据</p>
                                    </div>
                                ) : (
                                    (showMyPanels ? myPanels : panels).map((panel, index) => (
                                        <div key={index} className="panel-item">
                                            <div className="panel-id">
                                                <span className="label">ID</span>
                                                <span className="value">{panel.id.toString()}</span>
                                            </div>
                                            <div className="panel-detail location">
                                                <span className="label">位置</span>
                                                <span className="value">{panel.latitude.toString()}°, {panel.longitude.toString()}°</span>
                                            </div>
                                            <div className="panel-metrics">
                                                <div className="metric">
                                                    <Thermometer size={14} />
                                                    <span>{panel.batteryTemperature.toString()}°C</span>
                                                </div>
                                                <div className="metric">
                                                    <Zap size={14} />
                                                    <span>{panel.dcPower.toString()}W / {panel.acPower.toString()}W</span>
                                                </div>
                                            </div>
                                            <div className="panel-owner" title={panel.owner}>
                                                <span className="label">所有者</span>
                                                <span className="value">{`${panel.owner.substring(0, 6)}...${panel.owner.substring(panel.owner.length - 4)}`}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button
                className={`sidebar-toggle-btn ${sidebarOpen ? "open" : "closed"}`}
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
                style={{
                    top: `${navbarHeight + 10}px`, // 调整位置以适应navbar
                    zIndex: 1001 // 确保按钮可点击
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