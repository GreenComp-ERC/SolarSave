import React, { useState, useEffect, useContext } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "./Sidebar";
import PanelWindows from "./PanelWindows";
import TradeConfirm from "./TradeConfirm";
import FactoryConfirm from "./FactoryConfirm";
import kakilogo from "../../images/kali.png";
import { TransactionContext } from "../context/TransactionContext";
import EnergyExchangeABI from "../utils/test/EnergyExchange.json";
import contractAddresses from "../utils/contractAddress.json";
import { ethers } from "ethers";
// import SolarPanels from "../utils/SolarPanels.json";
import SolarPanels from "../utils/test/SolarPanels.json";
import "../style/MapSection.css";
import axios from "axios";
const contractAddress = contractAddresses.solarPanels;
const factoryAddress = contractAddresses.factory;
const FACTORY_ABI = [
  "function getAllFactories() view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])",
  "function getFactoriesOf(address user) view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])"
];

const MapSection = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [showPanelDetails, setShowPanelDetails] = useState(false);
  const [showTradeScript, setShowTradeScript] = useState(false);
  const [showFactoryModal, setShowFactoryModal] = useState(false);
  const [isConfirmingPanel, setIsConfirmingPanel] = useState(false);
  const [pendingPanelLocation, setPendingPanelLocation] = useState(null);
  const [pendingFactoryLocation, setPendingFactoryLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const { currentAccount, connectWallet } = useContext(TransactionContext);
  const [tradeScriptData, setTradeScriptData] = useState(null);
  const [contract, setContract] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [allPanels, setAllPanels] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [allFactories, setAllFactories] = useState([]);
  const [myFactories, setMyFactories] = useState([]);
  const [showMyPanels, setShowMyPanels] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);

  const energyExchangeAddress = contractAddresses.energyExchange;

  const [exchangeContract, setExchangeContract] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [lastClaimedAt, setLastClaimedAt] = useState(null);
  const [rewardPreview, setRewardPreview] = useState(null);


  const [stats, setStats] = useState({
    totalPanels: 0,
    totalPower: 0,
    myPanelsCount: 0,
    myPanelsPower: 0
  });
  const [markers, setMarkers] = useState([]);
  const isClaimable = rewardPreview && ethers.BigNumber.isBigNumber(rewardPreview) && rewardPreview.gt(0);

  // Connect wallet & contracts
  const connectToBlockchain = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }

  try {
    setIsLoading(true);

    // ✅ Correct order: init provider and signer, then init contract with signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    // ✅ Initialize contracts correctly
    const contractInstance = new ethers.Contract(contractAddress, SolarPanels.abi, signer);
    const factoryInstance = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    const exchangeCtr = new ethers.Contract(energyExchangeAddress, EnergyExchangeABI.abi, signer);

    setContract(contractInstance);
    setFactoryContract(factoryInstance);
    setExchangeContract(exchangeCtr);

    // ✅ Fetch reward-related info
    const last = await exchangeCtr.lastClaimedAt(accounts[0]);
    setLastClaimedAt(last.toNumber());

    const preview = await exchangeCtr.previewPersonalReward(accounts[0]);
    setRewardPreview(preview);

    // ✅ Fetch panels
    await fetchPanels(contractInstance);
    await fetchMyPanels(contractInstance);
    await fetchFactories(factoryInstance);
    await fetchMyFactories(factoryInstance, accounts[0]);

  } catch (error) {
    console.error("Failed to connect to blockchain:", error);
  } finally {
    setIsLoading(false);
  }
};
  const claimReward = async () => {
  try {
    if (!exchangeContract) {
      alert("Contract not connected");
      return;
    }

    const accountToCheck = currentAccount || (await window.ethereum.request({ method: "eth_requestAccounts" }))[0];
    const preview = await exchangeContract.previewPersonalReward(accountToCheck);
    if (!preview || !ethers.BigNumber.isBigNumber(preview) || preview.lte(0)) {
      alert("No reward to claim yet.");
      return;
    }

    const tx = await exchangeContract.claimPersonalReward();
    await tx.wait();
    alert("✅ Reward claimed successfully!");
    await connectToBlockchain(); // Refresh rewardPreview and cooldown
  } catch (e) {
    console.error("❌ Claim failed:", e);
    alert("❌ Reward claim failed!");
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
      const fixedLat = lat > 90 || lat < -90 ? lat / 10000 : lat;
      const fixedLng = lng > 180 || lng < -180 ? lng / 10000 : lng;
      const response = await axios.post("https://solarpay-8e3p.onrender.com/run_model/", {
        lat: fixedLat,
        lon: fixedLng,
        start_date: "2022-06-21",
        end_date: "2022-06-22",
        freq: "60min"
      });

      if (response.data.status !== "success") {
        throw new Error("API error: " + response.data.message);
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
      console.error("Failed to fetch prediction data:", err);
      return {
        batteryTemp: 25,
        dcPower: 100,
        acPower: 901,
      };
    }
  };

  const handleCreatePanel = (lat, lng) => {
  if (!currentAccount) {
    alert("Please connect your wallet first!");
    connectWallet();
    return;
  }

  // Set location first and show confirmation window
  setPendingPanelLocation({ lat, lng });
  setIsConfirmingPanel(true);
};



const setShowNotification = (msg) => {
  const note = document.createElement("div");
  note.className = "notification info";
  note.textContent = msg;
  document.body.appendChild(note);

  setTimeout(() => {
    note.classList.add("show");
    setTimeout(() => {
      note.classList.remove("show");
      setTimeout(() => document.body.removeChild(note), 300);
    }, 2000);
  }, 100);
};


  const confirmCreatePanel = async () => {
  setIsConfirmingPanel(false);
  setIsPredicting(true);  // Start loading

  const { lat, lng } = pendingPanelLocation;
  const isoTimestamp = "2022-06-21T15:00:00";

  try {
    const prediction = await fetchPredictedPanelData(lat, lng, isoTimestamp);

    setTradeScriptData({
      lat,
      lng,
      batteryTemp: prediction.batteryTemp,
      dcPower: prediction.dcPower,
      acPower: prediction.acPower,
      sandia_module_name: "Canadian_Solar_CS5P_220M___2009_",
      cec_inverter_name: "ABB__MICRO_0_25_I_OUTD_US_208__208V_",
    });

    setShowTradeScript(true);
  } catch (e) {
    alert("Failed to load prediction data!");
  } finally {
    setIsPredicting(false); // End loading
  }
};



  const cancelCreatePanel = () => {
    setIsConfirmingPanel(false);
    setPendingPanelLocation(null);
  };

  const openContextMenu = (lat, lng, position) => {
    setContextMenu({
      lat,
      lng,
      x: position.x,
      y: position.y
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuSolarPanel = () => {
    if (!contextMenu) return;
    const { lat, lng } = contextMenu;
    closeContextMenu();
    handleCreatePanel(lat, lng);
  };

  const handleMenuFactory = () => {
    if (!contextMenu) return;
    const { lat, lng } = contextMenu;
    closeContextMenu();
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      connectWallet();
      return;
    }
    setPendingFactoryLocation({ lat, lng });
    setShowFactoryModal(true);
  };

  const createFactoryOnClose = async (shouldRefresh = true) => {
    if (shouldRefresh && pendingFactoryLocation) {
      try {
        await fetchFactories();
        await fetchMyFactories();
        showNotification("Factory created successfully!");
      } catch (error) {
        console.error("Failed to refresh factories:", error);
        showNotification("Failed to refresh factories", "error");
      }
    }
    setPendingFactoryLocation(null);
    setShowFactoryModal(false);
  };

  const createPanelOnClose = async (shouldRefresh = true) => {
  if (shouldRefresh && pendingPanelLocation && mapInstance && contract) {
    const { lat, lng } = pendingPanelLocation;

    try {
      await fetchPanels();
      await fetchMyPanels();
      showNotification("Solar panel created successfully!");
    } catch (error) {
      console.error("Failed to create solar panel:", error);
      showNotification("Failed to create solar panel, please try again later", "error");
    }
  }

  setPendingPanelLocation(null);
  setShowTradeScript(false);
};


  // Show notification
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

  // Fetch all solar panels
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

      // Update stats
      const totalPower = formattedPanels.reduce((sum, panel) => {
      const correctedPower = panel.acPower > 100000 ? panel.acPower / 10000 : panel.acPower;
      return sum + correctedPower;
    }, 0);

    setStats(prev => ({
      ...prev,
      totalPanels: formattedPanels.length,
      totalPower
    }));
    } catch (error) {
      console.error("Failed to fetch all solar panels:", error);
    }
  };

  // Fetch user's solar panels
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

      // Update stats
          const myPanelsPower = formattedMyPanels.reduce((sum, panel) => {
      const correctedPower = panel.acPower > 100000 ? panel.acPower / 10000 : panel.acPower;
      return sum + correctedPower;
    }, 0);

    setStats(prev => ({
      ...prev,
      myPanelsCount: formattedMyPanels.length,
      myPanelsPower
    }));
    } catch (error) {
      console.error("Failed to fetch user solar panels:", error);
    }
  };

  const normalizeFactory = (factory) => {
    let lat = factory.latitude;
    let lng = factory.longitude;
    let consumption = factory.powerConsumption;

    if (lat > 90 || lng > 180 || lat < -90 || lng < -180) {
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        lat = lat / 10000;
        lng = lng / 10000;
        consumption = consumption / 10000;
      }
    }

    return {
      ...factory,
      latitude: lat,
      longitude: lng,
      powerConsumption: consumption
    };
  };

  const fetchFactories = async (factoryInstance = factoryContract) => {
    if (!factoryInstance) return;

    try {
      const rawFactories = await factoryInstance.getAllFactories();
      const formatted = rawFactories.map((factory, index) =>
        normalizeFactory({
          id: factory.id?.toNumber ? factory.id.toNumber() : index + 1,
          owner: factory.owner,
          latitude: factory.latitude.toNumber(),
          longitude: factory.longitude.toNumber(),
          powerConsumption: factory.powerConsumption.toNumber(),
          createdAt: factory.createdAt?.toNumber ? factory.createdAt.toNumber() : 0
        })
      );
      setAllFactories(formatted);
    } catch (error) {
      console.error("Failed to fetch all factories:", error);
    }
  };

  const fetchMyFactories = async (factoryInstance = factoryContract, account = currentAccount) => {
    if (!factoryInstance || !account) return;

    try {
      const rawFactories = await factoryInstance.getFactoriesOf(account);
      const formatted = rawFactories.map((factory, index) =>
        normalizeFactory({
          id: factory.id?.toNumber ? factory.id.toNumber() : index + 1,
          owner: factory.owner,
          latitude: factory.latitude.toNumber(),
          longitude: factory.longitude.toNumber(),
          powerConsumption: factory.powerConsumption.toNumber(),
          createdAt: factory.createdAt?.toNumber ? factory.createdAt.toNumber() : 0
        })
      );
      setMyFactories(formatted);
    } catch (error) {
      console.error("Failed to fetch user factories:", error);
    }
  };

  useEffect(() => {
    connectToBlockchain();

    // Listen for account changes
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
  useEffect(() => {
  const timer = setInterval(() => {
    if (lastClaimedAt !== null) {
      const now = Math.floor(Date.now() / 1000);
      const nextClaim = lastClaimedAt + 3600;
      const diff = nextClaim - now;
      setCooldownRemaining(diff > 0 ? diff : 0);
    }
  }, 1000);
  return () => clearInterval(timer);
}, [lastClaimedAt]);


  // Initialize map and default panels
  useEffect(() => {
    const map = L.map("map", {
      zoomControl: false, // Disable default zoom control
      attributionControl: false // Disable attribution control
    }).setView([31, 120], 10);

    // Use dark map theme
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add custom controls
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    setMapInstance(map);


    // Add hint text
    const infoControl = L.control({ position: 'bottomleft' });
    infoControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'info-control');
      div.innerHTML = 'Right-click the map to open the creation menu';
      return div;
    };
    infoControl.addTo(map);

    // Add default solar panels (keep original defaults)
    const panelsToShow = showMyPanels ? myPanels : allPanels;
    const customIcon = L.icon({
      iconUrl: kakilogo,
      iconSize: [50, 50],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      className: 'pulse-icon'
    });




  map.on("contextmenu", (e) => {
      openContextMenu(e.latlng.lat, e.latlng.lng, {
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY
      });
    });

  map.on("click", () => {
      closeContextMenu();
    });
    return () => {
      map.remove();
    };
  }, []);

  // Render solar panels on the map
  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    const panelsToShow = showMyPanels ? myPanels : allPanels;
    const factoriesToShow = showMyPanels ? myFactories : allFactories;
    const customIcon = L.icon({
      iconUrl: kakilogo,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });


    panelsToShow.forEach((panel) => {
      let lat = panel.lat;
      let lng = panel.lng;
      let batteryTemp = panel.batteryTemp;
      let dcPower = panel.dcPower;
      let acPower = panel.acPower;

      // If lat/lng are out of range, assume values were scaled by 10000
      if (lat > 90 || lng > 180 || lat < -90 || lng < -180) {
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        lat = lat / 10000;
        lng = lng / 10000;
        batteryTemp = batteryTemp / 10000;
        dcPower = dcPower / 10000;
        acPower = acPower / 10000;
      }
      }

      const marker = L.marker([lat, lng], { icon: customIcon })
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
                <span class="stat-value">${panel.batteryTemp/10000}°C</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">DC Power:</span>
                <span class="stat-value">${panel.dcPower/10000}W</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">AC Power:</span>
                <span class="stat-value">${panel.acPower/10000}W</span>
              </div>
            </div>
            <button class="details-button">More details</button>
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

    const factoryIcon = L.divIcon({
      className: "factory-marker",
      html: "<span>🏭</span>",
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    factoriesToShow.forEach((factory) => {
      const marker = L.marker([factory.latitude, factory.longitude], { icon: factoryIcon })
        .addTo(mapInstance)
        .bindPopup(
          `<div class="custom-popup">
            <h3>Factory ID: ${factory.id}</h3>
            <div class="popup-stats">
              <div class="stat-item">
                <span class="stat-label">Owner:</span>
                <span class="stat-value owner-address">${factory.owner.substring(0, 6)}...${factory.owner.substring(factory.owner.length - 4)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Consumption:</span>
                <span class="stat-value">${factory.powerConsumption}W</span>
              </div>
            </div>
          </div>`,
          { className: "custom-popup-container" }
        );

      marker.on("popupopen", () => {
        setSelectedPanel(null);
      });
    });

  }, [mapInstance, allPanels, myPanels, allFactories, myFactories, showMyPanels]);


    // Add panels fetched from blockchain


  return (
    <div className="map-section">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onVisibilityChange={setSidebarVisible}
      />

      <div
        className={`map-container ${sidebarVisible ? "with-sidebar" : "no-sidebar"}`}
        onClick={closeContextMenu}
      >
        <div className="header-overlay">
          <div className="header-content">
            <h2 className="header-title">Solar Panel Network</h2>
            <p className="header-subtitle">Right-click the map to open the creation menu</p>
          </div>
        </div>

        {/* Status bar */}
        <div className="stats-panel">
          <div className="stat-item">
            <div className="stat-value">{stats.totalPanels}</div>
            <div className="stat-label">Total panels</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalPower}W</div>
            <div className="stat-label">Total generation</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.myPanelsCount}</div>
            <div className="stat-label">My panels</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.myPanelsPower}W</div>
            <div className="stat-label">My generation</div>
          </div>
        </div>
        {/* Reward countdown & claim button */}
<div className="reward-timer-panel">
  <p style={{ marginBottom: "5px" }}>
    Reward countdown:
    {cooldownRemaining !== null && cooldownRemaining > 0
      ? `${Math.floor(cooldownRemaining / 60)}m ${cooldownRemaining % 60}s`
      : "Ready to claim"}
  </p>
  <button
    className="button"
    onClick={claimReward}
    disabled={cooldownRemaining > 0 || !isClaimable}
  >
    Claim reward ({rewardPreview ? ethers.utils.formatUnits(rewardPreview, 18) : "Loading..."} SOLR)
  </button>

</div>


        {/* Controls */}
        <div className="toggle-panel">
          <button
            className={`toggle-btn ${!showMyPanels ? "active" : ""}`}
            onClick={() => setShowMyPanels(false)}
          >
            <i className="fas fa-globe"></i> All Solar Panels
          </button>
          <button
            className={`toggle-btn ${showMyPanels ? "active" : ""}`}
            onClick={() => setShowMyPanels(true)}
          >
            <i className="fas fa-user"></i> My Solar Panels
          </button>
        </div>

        {/* Panel details */}
        {showPanelDetails && selectedPanel && (
          <PanelWindows
            panel={selectedPanel}
            closeWindow={() => setShowPanelDetails(false)}
          />
        )}

        {/* Context menu */}
        {contextMenu && (
          <div
            className="map-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="map-context-item" onClick={handleMenuSolarPanel}>
              Solar Panel
            </button>
            <button className="map-context-item" onClick={handleMenuFactory}>
              Factory
            </button>
          </div>
        )}

        {/* Map */}
        <div id="map" className="map"></div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading solar panel data...</p>
          </div>
        )}
      </div>

      {/* Confirm panel creation */}
      {isConfirmingPanel && (
        <div className="overlay">
          <div className="confirmation-popup">
            <h3>Create a new solar panel</h3>
            <p>Do you want to create a new solar panel at this location?</p>
            <div className="popup-buttons">
              <button className="btn-confirm" onClick={confirmCreatePanel}>Confirm</button>
              <button className="btn-cancel" onClick={cancelCreatePanel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Trade script */}

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
      {showFactoryModal && pendingFactoryLocation && (
        <FactoryConfirm
          close={createFactoryOnClose}
          lat={pendingFactoryLocation.lat}
          lng={pendingFactoryLocation.lng}
        />
      )}
      {isPredicting && (
  <div className="overlay">
    <div className="loading-popup">
      <div className="spinner"></div>
      <p>Loading prediction data, please wait...</p>
    </div>
  </div>
)}


    </div>

  );
};

export default MapSection;