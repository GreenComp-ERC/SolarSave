import React, { useState, useEffect, useContext } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "./Sidebar";
import PanelWindows from "./PanelWindows";
import ThreeDPopup from "./ThreeDPopup";
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
import { buildRegistrationEvidence, loadUrbanVerificationData } from "../utils/urbanVerification";
const contractAddress = contractAddresses.solarPanels;
const factoryAddress = contractAddresses.factory;
const FACTORY_ABI = [
  "function getAllFactories() view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])",
  "function getFactoriesOf(address user) view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])"
];
const SCALE_FACTOR = 10000;

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getPredictionDateRange = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return {
    startDate: formatLocalDate(yesterday),
    endDate: formatLocalDate(today),
  };
};

const normalizePanelData = (panel) => {
  let { lat, lng, batteryTemp, dcPower, acPower } = panel;

  const looksScaledCoords = Math.abs(lat) > 90 || Math.abs(lng) > 180;
  const looksScaledPower = Math.abs(dcPower) > SCALE_FACTOR || Math.abs(acPower) > SCALE_FACTOR;

  if (looksScaledCoords || looksScaledPower) {
    lat = lat / SCALE_FACTOR;
    lng = lng / SCALE_FACTOR;
    batteryTemp = batteryTemp / SCALE_FACTOR;
    dcPower = dcPower / SCALE_FACTOR;
    acPower = acPower / SCALE_FACTOR;
  }

  return { ...panel, lat, lng, batteryTemp, dcPower, acPower };
};

const MapSection = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [showThreeDPopup, setShowThreeDPopup] = useState(false);
  const [threeDPopupType, setThreeDPopupType] = useState('panel'); // 'panel' or 'factory'
  const [showPanelDetails, setShowPanelDetails] = useState(false);
  const [showTradeScript, setShowTradeScript] = useState(false);
  const [showFactoryModal, setShowFactoryModal] = useState(false);
  const [isConfirmingPanel, setIsConfirmingPanel] = useState(false);
  const [pendingPanelLocation, setPendingPanelLocation] = useState(null);
  const [pendingFactoryLocation, setPendingFactoryLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapViewState, setMapViewState] = useState(null);
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
  const [simulatorStepSeconds, setSimulatorStepSeconds] = useState(null);
  const [verificationRecords, setVerificationRecords] = useState([]);
  const [liquidityRecords, setLiquidityRecords] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    samples: true,
    panels: true,
    factories: true,
  });


  const [stats, setStats] = useState({
    totalPanels: 0,
    totalPower: 0,
    myPanelsCount: 0,
    myPanelsPower: 0
  });
  const [markers, setMarkers] = useState([]);
  const isClaimable = rewardPreview && ethers.BigNumber.isBigNumber(rewardPreview) && rewardPreview.gt(0);
  const plannerStats = React.useMemo(() => {
    const verified = verificationRecords.filter((record) => record.machineStatus === "verified").length;
    const rejected = verificationRecords.filter((record) => record.machineStatus === "rejected").length;
    const registered = verificationRecords.filter((record) => record.plannerDecision === "registered").length;
    const pending = verificationRecords.filter((record) => record.plannerDecision === "pending").length;
    const marketReadyW = verificationRecords
      .filter((record) => record.machineStatus === "verified" && record.plannerDecision !== "rejected")
      .reduce((sum, record) => sum + Math.min(record.pReportedW, record.pMaxW), 0);

    return {
      verified,
      rejected,
      registered,
      pending,
      marketReadyMW: marketReadyW / 1000000,
    };
  }, [verificationRecords]);
  const nearestFactory = React.useMemo(() => {
    if (!selectedVerification || !allFactories.length) return null;
    return allFactories.reduce((nearest, factory) => {
      const distance = Math.hypot(
        selectedVerification.lat - factory.latitude,
        selectedVerification.lng - factory.longitude
      );
      if (!nearest || distance < nearest.distance) {
        return { ...factory, distance };
      }
      return nearest;
    }, null);
  }, [selectedVerification, allFactories]);

  const getRecordStage = (record) => {
    if (record.plannerDecision === "registered") return "on-chain registered";
    if (record.plannerDecision === "approved") return "approved for signature";
    if (record.plannerDecision === "rejected") return "planner rejected";
    if (record.machineStatus === "rejected") return "machine rejected";
    return "candidate sample";
  };

  const appendAuditEvent = (event) => {
    setAuditEvents((previous) => [
      {
        timestamp: new Date().toISOString(),
        actor: currentAccount || "planner-session",
        ...event,
      },
      ...previous,
    ].slice(0, 12));
  };

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

    const stepSeconds = await exchangeCtr.simulatorStepSeconds();
    setSimulatorStepSeconds(stepSeconds.toNumber());

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
    window.dispatchEvent(new Event("chainStateUpdated"));
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
      const { startDate, endDate } = getPredictionDateRange();
      const response = await axios.post("http://127.0.0.1:8000/run_model/", {
        lat: fixedLat,
        lon: fixedLng,
        start_date: startDate,
        end_date: endDate,
        freq: "60min"
      });

      if (response.data.status !== "success") {
        throw new Error("API error: " + response.data.message);
      }

      const data = response.data.data;
      const keys = Object.keys(data.ac || {});
      const closestTime = getClosestTimestamp(keys, timestamp);

      const rawDcPower = Number(data.dc_power?.[closestTime]);
      const rawAcPower = Number(data.ac?.[closestTime]);
      const dcPower = Number.isFinite(rawDcPower) && rawDcPower > 0 ? rawDcPower : 100;
      const acFallback = Number.isFinite(rawAcPower) && rawAcPower >= 0 ? rawAcPower : 95;
      const acPower = Math.min(acFallback, dcPower * 0.98);

      return {
        batteryTemp: data.cell_temperature?.[closestTime] ?? 25,
        dcPower,
        acPower,
      };
    } catch (err) {
      console.error("Failed to fetch prediction data:", err);
      return {
        batteryTemp: 25,
        dcPower: 100,
        acPower: 95,
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
  const isoTimestamp = new Date().toISOString();

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
      evidence: buildRegistrationEvidence({
        id: "manual-map-selection",
        city: "Planner-selected coordinate",
        timestamp: isoTimestamp,
        acPower: prediction.acPower,
        dcPower: prediction.dcPower,
        pReportedW: prediction.acPower,
        pMaxW: prediction.dcPower,
        machineStatus: "verified",
      }),
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

  const beginRegistrationFromRecord = (record) => {
    const evidence = buildRegistrationEvidence(record);
    const updated = { ...record, plannerDecision: "approved" };
    setSelectedVerification(updated);
    setPendingPanelLocation({ lat: record.lat, lng: record.lng });
    setTradeScriptData({
      lat: record.lat,
      lng: record.lng,
      batteryTemp: record.airTemp,
      dcPower: Math.max(0, record.pMaxW),
      acPower: Math.max(0, Math.min(record.pReportedW, record.pMaxW || record.pReportedW)),
      sandia_module_name: `${record.city} DER node ${record.nodeId}`,
      cec_inverter_name: "Physics-bounded planner verification",
      evidence,
    });
    setShowTradeScript(true);
    setVerificationRecords((previous) =>
      previous.map((item) =>
        item.id === record.id ? updated : item
      )
    );
    appendAuditEvent({
      type: "planner-reviewed",
      recordId: record.id,
      decision: "approved",
      reason: "Planner approved node for wallet signature",
    });
  };

  const rejectVerificationRecord = (record) => {
    const updated = { ...record, plannerDecision: "rejected" };
    setVerificationRecords((previous) =>
      previous.map((item) => item.id === record.id ? updated : item)
    );
    setSelectedVerification(updated);
    appendAuditEvent({
      type: "planner-reviewed",
      recordId: record.id,
      decision: "rejected",
      reason: "Reported generation exceeds the machine-computed physics boundary",
    });
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
      const formattedPanels = allPanelsData.map((panel, index) => normalizePanelData({
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
      const totalPower = formattedPanels.reduce((sum, panel) => sum + panel.acPower, 0);

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
      const formattedMyPanels = myPanelsData.map((panel, index) => normalizePanelData({
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
          const myPanelsPower = formattedMyPanels.reduce((sum, panel) => sum + panel.acPower, 0);

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
      if (lastClaimedAt !== null && simulatorStepSeconds) {
      const now = Math.floor(Date.now() / 1000);
        const nextClaim = lastClaimedAt + simulatorStepSeconds;
      const diff = nextClaim - now;
      setCooldownRemaining(diff > 0 ? diff : 0);
    }
  }, 1000);
  return () => clearInterval(timer);
  }, [lastClaimedAt, simulatorStepSeconds]);

    useEffect(() => {
      if (!exchangeContract || !simulatorStepSeconds || !currentAccount) return;

      const refreshRewards = async () => {
        try {
          const last = await exchangeContract.lastClaimedAt(currentAccount);
          setLastClaimedAt(last.toNumber());

          const preview = await exchangeContract.previewPersonalReward(currentAccount);
          setRewardPreview(preview);
        } catch (error) {
          console.error("Failed to refresh reward data:", error);
        }
      };

      refreshRewards();
      const refreshTimer = setInterval(refreshRewards, simulatorStepSeconds * 1000);
      return () => clearInterval(refreshTimer);
    }, [exchangeContract, simulatorStepSeconds, currentAccount]);


  // Initialize map and default panels
  useEffect(() => {
    const map = L.map("map", {
      zoomControl: false, // Disable default zoom control
      attributionControl: false // Disable attribution control
    }).setView([31, 120], 10);

    // Use light map theme
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add custom controls
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    setMapInstance(map);

    const syncMapViewState = () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      setMapViewState({
        center: { lat: center.lat, lng: center.lng },
        zoom: map.getZoom(),
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      });
    };

    syncMapViewState();
    map.on('moveend zoomend', syncMapViewState);


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
    const defaultSolarIcon = L.divIcon({
      className: "solar-marker pulse-icon",
      html: "<span>☀️</span>",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
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
      map.off('moveend zoomend', syncMapViewState);
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

    const panelsToShow = layerVisibility.panels ? (showMyPanels ? myPanels : allPanels) : [];
    const factoriesToShow = layerVisibility.factories ? (showMyPanels ? myFactories : allFactories) : [];

    const solarIcon = L.divIcon({
      className: "solar-marker",
      html: "<span>☀️</span>",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
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

      const marker = L.marker([lat, lng], { icon: solarIcon })
        .addTo(mapInstance);

      marker.on("click", () => {
        setSelectedPanel(panel);
        setThreeDPopupType('panel');
        setShowThreeDPopup(true);
      });
    });

    const factoryIcon = L.divIcon({
      className: "factory-marker",
      html: "<span>🏭</span>",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });

    factoriesToShow.forEach((factory) => {
      const marker = L.marker([factory.latitude, factory.longitude], { icon: factoryIcon })
        .addTo(mapInstance);

      marker.on("click", () => {
        setSelectedFactory(factory);
        setThreeDPopupType('factory');
        setShowThreeDPopup(true);
      });
    });

    const verificationIcon = (record) => {
      const stageClass = record.plannerDecision === "registered"
        ? "registered"
        : record.plannerDecision === "rejected"
          ? "rejected"
          : record.riskLevel;
      const label = record.plannerDecision === "registered"
        ? "ON"
        : record.machineStatus === "rejected" || record.riskLevel === "high"
          ? "!"
          : "DER";

      return L.divIcon({
      className: `verification-marker verification-${stageClass}`,
      html: `<span>${label}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
    };

    const recordsToShow = layerVisibility.samples ? verificationRecords : verificationRecords.filter((record) => record.plannerDecision === "registered");
    recordsToShow.forEach((record) => {
      const marker = L.marker([record.lat, record.lng], { icon: verificationIcon(record) })
        .addTo(mapInstance);

      marker.on("click", () => {
        setSelectedVerification(record);
      });
    });

  }, [mapInstance, allPanels, myPanels, allFactories, myFactories, showMyPanels, verificationRecords, layerVisibility]);

  useEffect(() => {
    let isMounted = true;

    loadUrbanVerificationData()
      .then(({ verificationRecords: records, liquidityRecords: liquidity }) => {
        if (!isMounted) return;
        setVerificationRecords(records);
        setLiquidityRecords(liquidity);
        setSelectedVerification(records[0] || null);
      })
      .catch((error) => {
        console.error("Failed to load urban verification data:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuditEvent = (event) => {
      const detail = event.detail || {};
      appendAuditEvent(detail);
      if (detail.recordId) {
        setVerificationRecords((previous) =>
          previous.map((record) =>
            record.id === detail.recordId
              ? { ...record, plannerDecision: "registered" }
              : record
          )
        );
        setSelectedVerification((previous) =>
          previous?.id === detail.recordId
            ? { ...previous, plannerDecision: "registered" }
            : previous
        );
      }
    };

    window.addEventListener("plannerAuditEvent", handleAuditEvent);
    return () => window.removeEventListener("plannerAuditEvent", handleAuditEvent);
  }, [currentAccount]);


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
            <h2 className="header-title">Planner Decision Console</h2>
            <p className="header-subtitle">Machine boundary check, planner review, wallet signature, on-chain registration</p>
          </div>
        </div>

        <div className="planner-console">
          <div className="planner-panel planner-overview">
            <div className="planner-panel-header">
              <div>
                <h3>Planner Workbench</h3>
                <p>Candidate DER samples become registered solar panels only after expert review.</p>
              </div>
              <span className="planner-badge">{liquidityRecords.length} market hours</span>
            </div>
            <div className="planner-metrics">
              <div>
                <strong>{plannerStats.verified}</strong>
                <span>Verified DER</span>
              </div>
              <div>
                <strong>{plannerStats.rejected}</strong>
                <span>Rejected FDIA</span>
              </div>
              <div>
                <strong>{plannerStats.registered}</strong>
                <span>On-chain</span>
              </div>
              <div>
                <strong>{plannerStats.marketReadyMW.toFixed(3)}</strong>
                <span>Ready MW</span>
              </div>
            </div>
            <div className="layer-controls">
              <div className="panel-scope-toggle">
                <button
                  className={!showMyPanels ? "active" : ""}
                  onClick={() => setShowMyPanels(false)}
                >
                  All assets
                </button>
                <button
                  className={showMyPanels ? "active" : ""}
                  onClick={() => setShowMyPanels(true)}
                >
                  My assets
                </button>
              </div>
              {[
                ["samples", "Candidate DER Samples"],
                ["panels", "On-chain Solar Panels"],
                ["factories", "Factory Demand Nodes"],
              ].map(([key, label]) => (
                <label key={key} className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility[key]}
                    onChange={() => setLayerVisibility((previous) => ({
                      ...previous,
                      [key]: !previous[key],
                    }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="planner-reward-compact">
              <span>
                Reward:
                {cooldownRemaining === null
                  ? " loading"
                  : cooldownRemaining > 0
                    ? ` ${Math.floor(cooldownRemaining / 60)}m ${cooldownRemaining % 60}s`
                    : " ready"}
              </span>
              <button
                onClick={claimReward}
                disabled={cooldownRemaining > 0 || !isClaimable}
              >
                Claim {rewardPreview ? Number(ethers.utils.formatUnits(rewardPreview, 18)).toFixed(2) : "..."} SOLR
              </button>
            </div>
          </div>

          <div className="planner-panel planner-queue">
            <div className="planner-panel-header compact">
              <div>
                <h3>Candidate DER Queue</h3>
                <p>{verificationRecords.length} machine-checked samples</p>
              </div>
            </div>
            <div className="verification-list">
              {verificationRecords.slice(0, 10).map((record) => (
                <button
                  key={record.id}
                  className={`verification-row ${selectedVerification?.id === record.id ? "active" : ""} ${record.plannerDecision}`}
                  onClick={() => setSelectedVerification(record)}
                >
                  <span className={`risk-dot ${record.riskLevel}`}></span>
                  <span>
                    <strong>{record.nodeId}</strong>
                    <small>{record.city} H{String(record.hour).padStart(2, "0")} · {getRecordStage(record)}</small>
                  </span>
                  <span className="verification-values">
                    {record.pReportedW.toFixed(0)} / {record.pMaxW.toFixed(0)} W
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="planner-panel evidence-panel">
            <div className="planner-panel-header">
              <div>
                <h3>Review & Convert</h3>
                <p>{selectedVerification ? `${selectedVerification.city} - ${selectedVerification.nodeId} - ${getRecordStage(selectedVerification)}` : "Select a node"}</p>
              </div>
              {selectedVerification && (
                <span className={`status-pill ${selectedVerification.riskLevel}`}>
                  {selectedVerification.riskLevel} risk
                </span>
              )}
            </div>
            {selectedVerification ? (
              <>
                <div className="evidence-grid">
                  <div><span>Irradiance</span><strong>{selectedVerification.irradiance.toFixed(1)} W/m2</strong></div>
                  <div><span>Air Temp</span><strong>{selectedVerification.airTemp.toFixed(1)} C</strong></div>
                  <div><span>P_max</span><strong>{selectedVerification.pMaxW.toFixed(1)} W</strong></div>
                  <div><span>Reported</span><strong>{selectedVerification.pReportedW.toFixed(1)} W</strong></div>
                  <div><span>Residual</span><strong>{selectedVerification.residualW.toFixed(1)} W</strong></div>
                  <div><span>Machine</span><strong>{selectedVerification.machineStatus}</strong></div>
                  <div><span>Asset Type</span><strong>Candidate DER Sample</strong></div>
                  <div><span>Nearest Demand</span><strong>{nearestFactory ? `Factory #${nearestFactory.id}` : "No factory registered"}</strong></div>
                </div>
                <div className="lifecycle-strip">
                  <span className="done">Machine computed</span>
                  <span className={selectedVerification.plannerDecision !== "pending" ? "done" : ""}>Planner reviewed</span>
                  <span className={selectedVerification.plannerDecision === "registered" ? "done" : ""}>Wallet signed</span>
                  <span className={selectedVerification.plannerDecision === "registered" ? "done" : ""}>On-chain panel</span>
                </div>
                <div className="review-actions">
                  <button
                    className="review-approve"
                    onClick={() => beginRegistrationFromRecord(selectedVerification)}
                    disabled={selectedVerification.plannerDecision === "registered"}
                  >
                    Approve & convert to solar panel
                  </button>
                  <button
                    className="review-reject"
                    onClick={() => rejectVerificationRecord(selectedVerification)}
                  >
                    Reject FDIA
                  </button>
                </div>
              </>
            ) : (
              <p className="planner-empty">Select a queue record or map marker.</p>
            )}
          </div>

          <div className="planner-panel audit-panel">
            <div className="planner-panel-header">
              <div>
                <h3>Audit Trail</h3>
                <p>Shows how a candidate sample becomes a chain-backed asset.</p>
              </div>
            </div>
            <div className="audit-list">
              {auditEvents.length ? auditEvents.map((event, index) => (
                <div className="audit-event" key={`${event.timestamp}-${index}`}>
                  <span className="audit-type">{event.type || "audit"}</span>
                  <strong>{event.decision || event.recordId}</strong>
                  <small>{event.recordId} - {new Date(event.timestamp).toLocaleTimeString()}</small>
                  {event.txHash && <small className="audit-hash">{event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}</small>}
                </div>
              )) : (
                <p className="planner-empty">Review decisions will appear here during this session.</p>
              )}
            </div>
          </div>
        </div>


        {/* Panel details */}
        {showPanelDetails && selectedPanel && (
          <PanelWindows
            panel={selectedPanel}
            closeWindow={() => setShowPanelDetails(false)}
          />
        )}

        {showThreeDPopup && (
          <ThreeDPopup
            isOpen={showThreeDPopup}
            onClose={() => setShowThreeDPopup(false)}
            data={threeDPopupType === 'panel' ? selectedPanel : selectedFactory}
            type={threeDPopupType}
            mapView={mapViewState}
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
          evidence={tradeScriptData.evidence}
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
