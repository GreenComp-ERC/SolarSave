import React, { useContext, useEffect, useRef, useState } from "react";
import { FiSun, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { ethers } from "ethers";
import { TransactionContext } from "../context/TransactionContext";
import EnergyExchange from "../utils/test/EnergyExchange.json";
import SolarToken from "../utils/test/SolarToken.json";
import contractAddresses from "../utils/contractAddress.json";
import "../style/Transactions.css";

const exchangeAddress = contractAddresses.energyExchange;
const tokenAddress = contractAddresses.token;
const factoryAddress = contractAddresses.factory;

const FACTORY_ABI = [
  "function getAllFactories() view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])",
  "function getFactoriesOf(address user) view returns (tuple(uint256 id,address owner,uint256 latitude,uint256 longitude,uint256 powerConsumption,uint256 createdAt,bool exists)[])"
];

const normalizeEnergy = (value) => {
  if (!value) return 0;
  return Math.abs(value) > 1000 ? value / 10000 : value;
};

const formatNumber = (num) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const EnergyCard = ({ factory, balance }) => {
  const normalizedBalance = normalizeEnergy(balance);
  const normalizedConsumption = normalizeEnergy(factory.powerConsumption);
  const needsEnergy = normalizedBalance < normalizedConsumption;

  return (
    <>
      <div className="trans-card-header">
        <div className="trans-panel-name-section">
          <h3 className="trans-panel-title">Factory #{factory.id}</h3>
          <div className="trans-panel-id">Owner: {factory.owner.slice(0, 6)}...{factory.owner.slice(-4)}</div>
        </div>
        {needsEnergy && (
          <span
            style={{
              alignSelf: "flex-start",
              padding: "2px 6px",
              borderRadius: "6px",
              background: "rgba(255, 107, 107, 0.2)",
              color: "#ff6b6b",
              fontSize: "12px",
              fontWeight: "bold"
            }}
            title="Energy Balance below Consumption"
          >
            NEED ENERGY
          </span>
        )}
      </div>
    <div className="trans-performance-section">
      <div className="trans-metrics-grid">
        <div className="trans-metric-item">
          <div className="trans-metric-label">Location</div>
          <div className="trans-metric-value">{factory.latitude.toFixed(4)}°, {factory.longitude.toFixed(4)}°</div>
        </div>
        <div className="trans-metric-item">
          <div className="trans-metric-label">Consumption</div>
          <div className="trans-metric-value">{formatNumber(normalizedConsumption)} W</div>
        </div>
      </div>
      <div className="trans-power-section">
        <div className="trans-power-item">
          <div className="trans-power-header">
            <span className="trans-power-label">Energy Balance</span>
            <span className="trans-power-value">{formatNumber(normalizedBalance)} W</span>
          </div>
          <div className="trans-power-bar">
            <div className="trans-power-fill trans-ac-fill" style={{ width: `${Math.min(100, (normalizedBalance / normalizedConsumption) * 100 || 0)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  </>
);

};

const Transactions = () => {
  const { currentAccount } = useContext(TransactionContext);
  const [exchangeContract, setExchangeContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [supplyEnergy, setSupplyEnergy] = useState(0);
  const [demandEnergy, setDemandEnergy] = useState(0);
  const [deficitEnergy, setDeficitEnergy] = useState(0);
  const [factories, setFactories] = useState([]);
  const [balances, setBalances] = useState({});
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState("100");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [marketStepSeconds, setMarketStepSeconds] = useState(null);
  const [lastMarketStepAt, setLastMarketStepAt] = useState(null);
  const [marketCountdownRemaining, setMarketCountdownRemaining] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const refreshInFlight = useRef(false);
  const lastForcedRefreshAtRef = useRef(0);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const formatCountdown = (seconds) => {
    const clamped = Math.max(0, seconds);
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${mins}m ${secs}s`;
  };

  const handleManualRefresh = () => {
    refreshExchange();
    showMessage("success", "Market data refreshed.");
  };

  const handleQuickFill = (type) => {
    if (!selectedFactory) return;
    const consumption = normalizeEnergy(selectedFactory.powerConsumption);
    const balance = normalizeEnergy(balances[selectedFactory.id] || 0);
    const deficit = Math.max(0, consumption - balance);

    if (type === "deficit") {
      setPurchaseAmount(Math.ceil(deficit).toString());
    } else if (type === "100W") {
      setPurchaseAmount("100");
    } else if (type === "500W") {
      setPurchaseAmount("500");
    }
  };

  const refreshExchange = async (exchangeCtr = exchangeContract, factoryCtr = factoryContract) => {
    if (!exchangeCtr || !factoryCtr) return;
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;

    try {
      const [supply, demand, stepSeconds, lastStepAt] = await Promise.all([
        exchangeCtr.globalSupplyEnergy(),
        exchangeCtr.totalDemandEnergy(),
        exchangeCtr.simulatorStepSeconds(),
        exchangeCtr.lastMarketStepAt()
      ]);

      const supplyRaw = supply.toNumber();
      const demandRaw = demand.toNumber();
      setSupplyEnergy(supplyRaw);
      setDemandEnergy(demandRaw);
      setDeficitEnergy(Math.max(0, demandRaw - supplyRaw));
      setMarketStepSeconds(stepSeconds.toNumber());
      setLastMarketStepAt(lastStepAt.toNumber());

      const factoryList = await factoryCtr.getAllFactories();
      const formatted = factoryList.map((factory) => ({
        id: factory.id.toNumber(),
        owner: factory.owner,
        latitude: normalizeEnergy(factory.latitude.toNumber()),
        longitude: normalizeEnergy(factory.longitude.toNumber()),
        powerConsumption: factory.powerConsumption.toNumber()
      }));
      setFactories(formatted);

      const balanceMap = {};
      for (const factory of formatted) {
        const bal = await exchangeCtr.factoryEnergyBalance(factory.id);
        balanceMap[factory.id] = bal.toNumber();
      }
      setBalances(balanceMap);
    } catch (error) {
      console.error("Failed to refresh exchange:", error);
    } finally {
      refreshInFlight.current = false;
    }
  };

  useEffect(() => {
    const connect = async () => {
      if (!window.ethereum || !currentAccount) return;
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const exchangeCtr = new ethers.Contract(exchangeAddress, EnergyExchange.abi, signer);
      const tokenCtr = new ethers.Contract(tokenAddress, SolarToken.abi, signer);
      const factoryCtr = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);

      setExchangeContract(exchangeCtr);
      setTokenContract(tokenCtr);
      setFactoryContract(factoryCtr);

      await refreshExchange(exchangeCtr, factoryCtr);
      setLoading(false);
    };

    connect();
  }, [currentAccount]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastMarketStepAt || !marketStepSeconds) {
        setMarketCountdownRemaining(null);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const nextUpdate = lastMarketStepAt + marketStepSeconds;
      const diff = Math.max(0, nextUpdate - now);
      setMarketCountdownRemaining(diff);

      // Keep refreshing after cycle boundary until chain timestamp advances.
      if (now >= nextUpdate) {
        const nowMs = Date.now();
        if (nowMs - lastForcedRefreshAtRef.current >= 1200) {
          lastForcedRefreshAtRef.current = nowMs;
          refreshExchange();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastMarketStepAt, marketStepSeconds, exchangeContract, factoryContract]);

  useEffect(() => {
    const handleChainUpdate = () => {
      refreshExchange();
    };
    window.addEventListener("chainStateUpdated", handleChainUpdate);
    return () => window.removeEventListener("chainStateUpdated", handleChainUpdate);
  }, [exchangeContract, factoryContract]);

  useEffect(() => {
    if (!exchangeContract) return;

    const handleMarketStepUpdated = () => {
      refreshExchange();
    };

    try {
      exchangeContract.on("MarketStepUpdated", handleMarketStepUpdated);
    } catch (error) {
      // Some providers may not support event subscriptions; timer-based refresh remains active.
      console.warn("MarketStepUpdated subscription unavailable:", error);
    }

    return () => {
      try {
        exchangeContract.off("MarketStepUpdated", handleMarketStepUpdated);
      } catch {
        // no-op
      }
    };
  }, [exchangeContract, factoryContract]);

  useEffect(() => {
    const updateEstimate = async () => {
      if (!exchangeContract || !purchaseAmount) return;
      const energyAmount = Math.max(0, Math.floor(Number(purchaseAmount) * 10000));
      if (energyAmount === 0) {
        setEstimatedCost("0");
        return;
      }
      try {
        const cost = await exchangeContract.previewCost(energyAmount);
        setEstimatedCost(ethers.utils.formatEther(cost));
      } catch (error) {
        setEstimatedCost("0");
      }
    };
    updateEstimate();
  }, [purchaseAmount, exchangeContract]);

  const handleBuyEnergy = async () => {
    if (!selectedFactory) {
      showMessage("error", "Select a factory first");
      return;
    }
    if (!exchangeContract || !tokenContract) {
      showMessage("error", "Contract not connected");
      return;
    }
    const energyAmount = Math.max(0, Math.floor(Number(purchaseAmount) * 10000));
    if (energyAmount <= 0) {
      showMessage("error", "Enter a valid energy amount");
      return;
    }

    setIsPurchasing(true);
    try {
      const costWei = await exchangeContract.previewCost(energyAmount);
      const allowance = await tokenContract.allowance(currentAccount, exchangeAddress);
      if (allowance.lt(costWei)) {
        const approveTx = await tokenContract.approve(exchangeAddress, costWei);
        await approveTx.wait();
      }

      const tx = await exchangeContract.buyEnergyForFactory(selectedFactory.id, energyAmount);
      await tx.wait();
      setSupplyEnergy((prev) => Math.max(0, (prev || 0) - energyAmount));
      setBalances((prev) => ({
        ...prev,
        [selectedFactory.id]: (prev[selectedFactory.id] || 0) + energyAmount
      }));
      await refreshExchange();
      window.dispatchEvent(new Event("chainStateUpdated"));
      showMessage("success", "Energy purchased and burned successfully!");
    } catch (error) {
      console.error("Purchase failed", error);
      showMessage("error", "Purchase failed: " + (error.reason || error.message || "Unknown error"));
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="trans-marketplace">
      {message.text && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          backgroundColor: message.type === "error" ? "rgba(244, 67, 54, 0.9)" : "rgba(76, 175, 80, 0.9)",
          color: "white",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontWeight: "500"
        }}>
          {message.type === "error" ? <FiAlertCircle /> : <FiSun />}
          {message.text}
        </div>
      )}
      <div className="trans-container">
        <div className="trans-header">
          <div className="trans-main-title">
            <FiSun className="trans-title-icon" />
            <h1>Solar Energy Exchange</h1>
          </div>
        </div>

        <div className="trans-layout">
          <div className="trans-sidebar">
            <div className="trans-section-card">
              <div className="trans-section-header">
                <h2 className="trans-section-title">
                  <span className="trans-section-icon">🏭</span>
                  Factories
                </h2>
                <div className="trans-panel-count">{factories.length} factories</div>
              </div>
              <div className="trans-panels-list">
                {loading ? (
                  <div className="trans-empty-state">
                    <div className="trans-empty-icon">⏳</div>
                    <p className="trans-empty-text">Loading factories...</p>
                  </div>
                ) : factories.length > 0 ? (
                  factories.map((factory) => (
                    <div
                      key={factory.id}
                      className={`trans-panel-card ${selectedFactory?.id === factory.id ? "trans-selected" : ""}`}
                      onClick={() => setSelectedFactory(factory)}
                    >
                      <EnergyCard factory={factory} balance={balances[factory.id] || 0} />
                    </div>
                  ))
                ) : (
                  <div className="trans-empty-state">
                    <div className="trans-empty-icon">🔋</div>
                    <p className="trans-empty-text">No factories found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="trans-main-content">
            <div className="trans-section-card">
              <div className="trans-section-header">
                <h2 className="trans-section-title">
                  <span className="trans-section-icon">⚡</span>
                  Energy Market
                </h2>
                <div className="trans-market-timer">
                  <span className="trans-market-timer-text">
                    Next update: {marketCountdownRemaining === null
                      ? "Loading..."
                      : formatCountdown(marketCountdownRemaining)}
                  </span>
                  <button 
                    className="trans-refresh-btn" 
                    onClick={handleManualRefresh}
                    disabled={refreshInFlight.current}
                    title="Refresh Market Data"
                  >
                    <FiRefreshCw />
                  </button>
                </div>
              </div>
              <div className="trans-shop-grid">
                <div className="trans-panel-card">
                  <div className="trans-card-header">
                    <h3 className="trans-panel-title">Market Overview</h3>
                  </div>
                  <div className="trans-performance-section">
                    <div className="trans-metrics-grid" style={{ marginBottom: 0 }}>
                      <div className="trans-metric-item">
                        <div className="trans-metric-label">Available Supply</div>
                        <div className="trans-metric-value" style={{ color: "var(--success-color)", fontSize: "1.2rem" }}>
                          {formatNumber(normalizeEnergy(supplyEnergy))} W
                        </div>
                      </div>
                      <div className="trans-metric-item">
                        <div className="trans-metric-label">Total Demand</div>
                        <div className="trans-metric-value">{formatNumber(normalizeEnergy(demandEnergy))} W</div>
                      </div>
                      <div className="trans-metric-item" style={{ marginTop: "1rem" }}>
                        <div className="trans-metric-label">Current Deficit</div>
                        <div className="trans-metric-value" style={{ color: deficitEnergy > 0 ? "var(--error-color)" : "inherit" }}>
                          {formatNumber(normalizeEnergy(deficitEnergy))} W
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Visual Indicator of Supply relative to Demand */}
                  <div className="trans-power-section" style={{ marginTop: "1rem", padding: "0 1rem" }}>
                    <div className="trans-power-header">
                      <span className="trans-power-label">Supply vs Total Demand</span>
                      <span className="trans-power-value">{demandEnergy > 0 ? Math.min(100, (supplyEnergy / demandEnergy) * 100).toFixed(1) : 100}%</span>
                    </div>
                    <div className="trans-power-bar" style={{ backgroundColor: "rgba(244, 67, 54, 0.2)" }}>
                      <div className="trans-power-fill trans-ac-fill" style={{ 
                        width: `${demandEnergy > 0 ? Math.min(100, (supplyEnergy / demandEnergy) * 100) : 100}%`,
                        backgroundColor: supplyEnergy >= demandEnergy ? "var(--success-color)" : "var(--warning-color)"
                      }}></div>
                    </div>
                  </div>
                </div>

                <div className="trans-panel-card">
                  <div className="trans-card-header">
                    <h3 className="trans-panel-title">Buy Energy</h3>
                  </div>
                  <div className="trans-performance-section">
                    <div className="trans-metric-item">
                      <div className="trans-metric-label">Selected Factory</div>
                      <div className="trans-metric-value">
                        {selectedFactory ? `Factory #${selectedFactory.id}` : "Select a factory"}
                      </div>
                    </div>
                    <div className="trans-metric-item" style={{ marginTop: "1rem" }}>
                      <div className="trans-metric-label">Energy Amount (W)</div>
                      <input
                        className="trans-price-input"
                        type="number"
                        min="1"
                        step="1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        disabled={isPurchasing}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.3)", color: "white" }}
                      />
                      <div className="trans-quick-btn-group">
                        <button className="trans-quick-btn" onClick={() => handleQuickFill("deficit")} disabled={!selectedFactory || isPurchasing}>Fill Deficit</button>
                        <button className="trans-quick-btn" onClick={() => handleQuickFill("100W")} disabled={isPurchasing}>100 W</button>
                        <button className="trans-quick-btn" onClick={() => handleQuickFill("500W")} disabled={isPurchasing}>500 W</button>
                      </div>
                    </div>
                    <div className="trans-metric-item" style={{ marginTop: "1rem" }}>
                      <div className="trans-metric-label">Estimated Cost</div>
                      <div className="trans-metric-value" style={{ color: "var(--primary-color)" }}>{formatNumber(Number(estimatedCost))} SOLR</div>
                    </div>
                  </div>
                  <button
                    className="trans-action-button"
                    onClick={handleBuyEnergy}
                    disabled={isPurchasing || !selectedFactory}
                  >
                    {isPurchasing ? (
                      <>
                        <FiRefreshCw className="trans-title-icon" style={{ animation: "spin 1s linear infinite", fontSize: "1rem" }} />
                        Processing...
                      </>
                    ) : (
                      "Purchase & Burn"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
