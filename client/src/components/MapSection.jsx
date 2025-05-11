import React, { useState, useEffect, useContext } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "./Sidebar";
import PanelWindows from "./PanelWindows";
import TradeConfirm from "./TradeConfirm";
import kakilogo from "../../images/kali.png";
import { TransactionContext } from "../context/TransactionContext";
import { ethers } from "ethers";
import SolarPanels from "../utils/SolarPanels.json";
import "../style/MapSection.css";
import axios from "axios";
const contractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9";

const MapSection = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [showPanelDetails, setShowPanelDetails] = useState(false);
  const [showTradeScript, setShowTradeScript] = useState(false);
  const [isConfirmingPanel, setIsConfirmingPanel] = useState(false);
  const [pendingPanelLocation, setPendingPanelLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const { currentAccount, connectWallet } = useContext(TransactionContext);
  const [tradeScriptData, setTradeScriptData] = useState(null);
  const [contract, setContract] = useState(null);
  const [allPanels, setAllPanels] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [showMyPanels, setShowMyPanels] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPanels: 0,
    totalPower: 0,
    myPanelsCount: 0,
    myPanelsPower: 0
  });
  const [markers, setMarkers] = useState([]);

  // 连接钱包 & 合约
  const connectToBlockchain = async () => {
    if (!window.ethereum) {
      alert("请安装 MetaMask!");
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, SolarPanels.abi, signer);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      setContract(contractInstance);
      await fetchPanels(contractInstance);
      await fetchMyPanels(contractInstance);
    } catch (error) {
      console.error("连接区块链失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const getClosestTimestamp = (keys, target) => {
    const targetTime = new Date(target).getTime();
    let closest = keys[0];
    let minDiff = Math.abs(new Date(closest).getTime() - targetTime);

    keys.forEach((key) => {
      const diff = Math.abs(new Date(key).getTime() - targetTime);
      if (diff < minDiff) {
        closest = key;
        minDiff = diff;
      }
    });

    return closest;
  };

  const fetchPredictedPanelData = async (lat, lng, timestamp) => {
    try {
      const response = await axios.post("https://solarpay-8e3p.onrender.com/run_model/", {
        lat: lat,
        lon: lng,
        start_date: "2022-06-21",
        end_date: "2022-06-22",
        freq: "60min"
      });

      if (response.data.status !== "success") {
        throw new Error("API 返回失败: " + response.data.message);
      }

      const data = response.data.data;
      const keys = Object.keys(data.ac || {});
      const closestTime = getClosestTimestamp(keys, timestamp);

      return {
        batteryTemp: data.cell_temperature?.[closestTime] ?? 25,
        dcPower: data["dc(v_mp)"]?.[closestTime] ?? 100,
        acPower: data.ac?.[closestTime] ?? 900,
      };
    } catch (err) {
      console.error("获取预测数据失败:", err);
      return {
        batteryTemp: 25,
        dcPower: 100,
        acPower: 901,
      };
    }
  };

  const handleCreatePanel = async (lat, lng) => {
    if (currentAccount) {
      alert("请先连接钱包！");
      connectWallet();
      return;
    }

    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    const isoTimestamp = now.toISOString().slice(0, 19);

    const prediction = await fetchPredictedPanelData(lat, lng, isoTimestamp);

    setPendingPanelLocation({ lat, lng });
    setIsConfirmingPanel(true);
    setTradeScriptData({
      lat,
      lng,
      batteryTemp: prediction.batteryTemp,
      dcPower: prediction.dcPower,
      acPower: prediction.acPower,
      sandia_module_name: "Canadian_Solar_CS5P_220M___2009_",
      cec_inverter_name: "ABB__MICRO_0_25_I_OUTD_US_208__208V_",
    });
  };




  const confirmCreatePanel = () => {
    setIsConfirmingPanel(false);
    setShowTradeScript(true);
  };

  const cancelCreatePanel = () => {
    setIsConfirmingPanel(false);
    setPendingPanelLocation(null);
  };

  const createPanelOnClose = async () => {
    if (pendingPanelLocation && mapInstance && contract) {
      const { lat, lng } = pendingPanelLocation;

      try {



        // 等待交易确认
        await tx.wait();

        // 刷新面板数据
        await fetchPanels();
        await fetchMyPanels();

        // 显示成功消息
        showNotification("太阳能面板创建成功!");
      } catch (error) {
        console.error("创建太阳能面板失败:", error);
        showNotification("创建太阳能面板失败，请稍后再试", "error");
      }

      setPendingPanelLocation(null);
    }
    setShowTradeScript(false);
  };

  // 显示通知
  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }, 100);
  };

  // 获取所有太阳能板
  const fetchPanels = async (contractInstance = contract) => {
    if (!contractInstance) return;

    try {
      const allPanelsData = await contractInstance.getAllPanels();
      const formattedPanels = allPanelsData.map((panel, index) => ({
        id: index + 1,
        owner: panel.owner,
        lat: panel.latitude.toNumber() ,
        lng: panel.longitude.toNumber(),
        batteryTemp: panel.batteryTemperature.toNumber(),
        dcPower: panel.dcPower.toNumber(),
        acPower: panel.acPower.toNumber(),
      }));

      setAllPanels(formattedPanels);

      // 更新统计数据
      const totalPower = formattedPanels.reduce((sum, panel) => sum + panel.acPower, 0);
      setStats(prev => ({
        ...prev,
        totalPanels: formattedPanels.length,
        totalPower
      }));
    } catch (error) {
      console.error("获取所有太阳能板失败:", error);
    }
  };

  // 获取用户的太阳能板
  const fetchMyPanels = async (contractInstance = contract) => {
    if (!contractInstance) return;

    try {
      const myPanelsData = await contractInstance.getMyPanels();
      const formattedMyPanels = myPanelsData.map((panel, index) => ({
        id: index + 1,
        owner: panel.owner,
        lat: panel.latitude.toNumber(),
        lng: panel.longitude.toNumber(),
        batteryTemp: panel.batteryTemperature.toNumber(),
        dcPower: panel.dcPower.toNumber(),
        acPower: panel.acPower.toNumber(),
      }));

      setMyPanels(formattedMyPanels);

      // 更新统计数据
      const myPanelsPower = formattedMyPanels.reduce((sum, panel) => sum + panel.acPower, 0);
      setStats(prev => ({
        ...prev,
        myPanelsCount: formattedMyPanels.length,
        myPanelsPower
      }));
    } catch (error) {
      console.error("获取用户太阳能板失败:", error);
    }
  };

  useEffect(() => {
    connectToBlockchain();

    // 监听账户变化
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        connectToBlockchain();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // 初始化地图和默认面板
  useEffect(() => {
    const map = L.map("map", {
      zoomControl: false, // 禁用默认缩放控件
      attributionControl: false // 禁用归属控件
    }).setView([31, 120], 10);

    // 使用深色地图主题
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // 添加自定义控件
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    setMapInstance(map);


    // 添加右键菜单事件
    map.on("contextmenu", (e) => {
      handleCreatePanel(e.latlng.lat, e.latlng.lng);
    });

    // 添加提示信息
    const infoControl = L.control({ position: 'bottomleft' });
    infoControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'info-control');
      div.innerHTML = '右键点击地图创建太阳能板';
      return div;
    };
    infoControl.addTo(map);

    // 添加默认太阳能板 (保留原代码中的默认面板)
    const panelsToShow = showMyPanels ? myPanels : allPanels;
    const customIcon = L.icon({
      iconUrl: kakilogo,
      iconSize: [50, 50],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      className: 'pulse-icon'
    });




  map.on("contextmenu", (e) => {
      handleCreatePanel(e.latlng.lat, e.latlng.lng);
    });
    return () => {
      map.remove();
    };
  }, []);

  // 在地图上展示太阳能板
  // 在地图上展示太阳能板
  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    const panelsToShow = showMyPanels ? myPanels : allPanels;
    const customIcon = L.icon({
      iconUrl: kakilogo,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });

    panelsToShow.forEach((panel) => {
      const marker = L.marker([panel.lat, panel.lng], { icon: customIcon })
        .addTo(mapInstance)
        .bindPopup(
          `<div class="custom-popup">
            <h3>Panel ID: ${panel.id}</h3>
            <div class="popup-stats">
              <div class="stat-item">
                <span class="stat-label">Owner:</span>
                <span class="stat-value owner-address">${panel.owner.substring(0, 6)}...${panel.owner.substring(panel.owner.length - 4)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Battery Temp:</span>
                <span class="stat-value">${panel.batteryTemp}°C</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">DC Power:</span>
                <span class="stat-value">${panel.dcPower}W</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">AC Power:</span>
                <span class="stat-value">${panel.acPower}W</span>
              </div>
            </div>
            <button class="details-button">View Details</button>
          </div>`,
          { className: "custom-popup-container" }
        );

      marker.on("popupopen", () => {
        setSelectedPanel(panel);
        document.querySelector(".details-button").addEventListener("click", () => {
          setShowPanelDetails(true);
        });
      });
    });

  }, [mapInstance, allPanels, myPanels, showMyPanels]);


    // 添加从区块链获取的面板


  return (
    <div className="map-section">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={`map-container ${sidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
        <div className="header-overlay">
          <div className="header-content">
            <h2 className="header-title">Solar Panel Network</h2>
            <p className="header-subtitle">右键点击地图创建太阳能板获得收益</p>
          </div>
        </div>

        {/* 状态栏 */}
        <div className="stats-panel">
          <div className="stat-item">
            <div className="stat-value">{stats.totalPanels}</div>
            <div className="stat-label">总面板数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalPower}W</div>
            <div className="stat-label">总发电量</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.myPanelsCount}</div>
            <div className="stat-label">我的面板</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.myPanelsPower}W</div>
            <div className="stat-label">我的发电量</div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="toggle-panel">
          <button
            className={`toggle-btn ${!showMyPanels ? "active" : ""}`}
            onClick={() => setShowMyPanels(false)}
          >
            <i className="fas fa-globe"></i> 所有太阳能板
          </button>
          <button
            className={`toggle-btn ${showMyPanels ? "active" : ""}`}
            onClick={() => setShowMyPanels(true)}
          >
            <i className="fas fa-user"></i> 我的太阳能板
          </button>
        </div>

        {/* 面板详情 */}
        {showPanelDetails && selectedPanel && (
          <PanelWindows
            panel={selectedPanel}
            closeWindow={() => setShowPanelDetails(false)}
          />
        )}

        {/* 地图 */}
        <div id="map" className="map"></div>

        {/* 加载指示器 */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>加载太阳能板数据...</p>
          </div>
        )}
      </div>

      {/* 确认面板创建 */}
      {isConfirmingPanel && (
        <div className="overlay">
          <div className="confirmation-popup">
            <h3>创建新太阳能板</h3>
            <p>您想在此位置创建一个新的太阳能板吗？</p>
            <div className="popup-buttons">
              <button className="btn-confirm" onClick={confirmCreatePanel}>确认</button>
              <button className="btn-cancel" onClick={cancelCreatePanel}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 交易脚本 */}

      {showTradeScript && (
        <TradeConfirm
          close={createPanelOnClose}
          lat={tradeScriptData.lat}
          lng={tradeScriptData.lng}
          batterTemp={tradeScriptData.batteryTemp}
          dcPower={tradeScriptData.dcPower}
          acPower={tradeScriptData.acPower}
          sandiaModuleName={tradeScriptData.sandia_module_name}
          cecInverterName={tradeScriptData.cec_inverter_name}
        />
      )}

    </div>
  );
};

export default MapSection;