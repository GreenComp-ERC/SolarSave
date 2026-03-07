import React, { useContext, useEffect, useState } from "react";
import { FiSun } from "react-icons/fi";
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

const EnergyCard = ({ factory, balance }) => (
  <>
    <div className="trans-card-header">
      <div className="trans-panel-name-section">
        <h3 className="trans-panel-title">Factory #{factory.id}</h3>
        <div className="trans-panel-id">Owner: {factory.owner.slice(0, 6)}...{factory.owner.slice(-4)}</div>
      </div>
    </div>
    <div className="trans-performance-section">
      <div className="trans-metrics-grid">
        <div className="trans-metric-item">
          <div className="trans-metric-label">Location</div>
          <div className="trans-metric-value">{factory.latitude.toFixed(4)}°, {factory.longitude.toFixed(4)}°</div>
        </div>
        <div className="trans-metric-item">
          <div className="trans-metric-label">Consumption</div>
          <div className="trans-metric-value">{normalizeEnergy(factory.powerConsumption)} W</div>
        </div>
      </div>
      <div className="trans-power-section">
        <div className="trans-power-item">
          <div className="trans-power-header">
            <span className="trans-power-label">Energy Balance</span>
            <span className="trans-power-value">{normalizeEnergy(balance)} W</span>
          </div>
          <div className="trans-power-bar">
            <div className="trans-power-fill trans-ac-fill" style={{ width: `${Math.min(100, normalizeEnergy(balance) / 10)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  </>
);

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

  const refreshExchange = async (exchangeCtr = exchangeContract, factoryCtr = factoryContract) => {
    if (!exchangeCtr || !factoryCtr) return;

    const [supply, demand] = await Promise.all([
      exchangeCtr.globalSupplyEnergy(),
      exchangeCtr.totalDemandEnergy()
    ]);

    const supplyRaw = supply.toNumber();
    const demandRaw = demand.toNumber();
    setSupplyEnergy(supplyRaw);
    setDemandEnergy(demandRaw);
    setDeficitEnergy(Math.max(0, demandRaw - supplyRaw));

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
      alert("Select a factory first");
      return;
    }
    if (!exchangeContract || !tokenContract) {
      alert("Contract not connected");
      return;
    }
    const energyAmount = Math.max(0, Math.floor(Number(purchaseAmount) * 10000));
    if (energyAmount <= 0) {
      alert("Enter a valid energy amount");
      return;
    }

    try {
      const costWei = await exchangeContract.previewCost(energyAmount);
      const allowance = await tokenContract.allowance(currentAccount, exchangeAddress);
      if (allowance.lt(costWei)) {
        const approveTx = await tokenContract.approve(exchangeAddress, costWei);
        await approveTx.wait();
      }

      const tx = await exchangeContract.buyEnergyForFactory(selectedFactory.id, energyAmount);
      await tx.wait();
      await refreshExchange();
      alert("✅ Energy purchased and burned successfully!");
    } catch (error) {
      console.error("Purchase failed", error);
      alert("❌ Purchase failed");
    }
  };

  return (
    <div className="trans-marketplace">
      <div className="trans-container">
        <div className="trans-header">
          <h1 className="trans-main-title">
            <FiSun className="trans-title-icon" />
            Solar Energy Exchange
          </h1>
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
              </div>
              <div className="trans-shop-grid">
                <div className="trans-panel-card">
                  <div className="trans-card-header">
                    <h3 className="trans-panel-title">Global Supply</h3>
                  </div>
                  <div className="trans-performance-section">
                    <div className="trans-metric-item">
                      <div className="trans-metric-label">Available Energy</div>
                      <div className="trans-metric-value">{normalizeEnergy(supplyEnergy)} W</div>
                    </div>
                  </div>
                </div>

                <div className="trans-panel-card">
                  <div className="trans-card-header">
                    <h3 className="trans-panel-title">Global Demand</h3>
                  </div>
                  <div className="trans-performance-section">
                    <div className="trans-metric-item">
                      <div className="trans-metric-label">Demand Energy</div>
                      <div className="trans-metric-value">{normalizeEnergy(demandEnergy)} W</div>
                    </div>
                    <div className="trans-metric-item">
                      <div className="trans-metric-label">Current Deficit</div>
                      <div className="trans-metric-value">{normalizeEnergy(deficitEnergy)} W</div>
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
                    <div className="trans-metric-item">
                      <div className="trans-metric-label">Energy Amount (W)</div>
                      <input
                        className="trans-price-input"
                        type="number"
                        min="1"
                        step="1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                      />
                    </div>
                    <div className="trans-metric-item">
                      <div className="trans-metric-label">Estimated Cost</div>
                      <div className="trans-metric-value">{estimatedCost} SOLR</div>
                    </div>
                    <button
                      className="trans-action-button trans-list-button"
                      onClick={handleBuyEnergy}
                    >
                      Purchase & Burn
                    </button>
                  </div>
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
