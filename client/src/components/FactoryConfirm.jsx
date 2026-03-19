import React, { useEffect, useState } from "react";
import { SiEthereum } from "react-icons/si";
import { BsInfoCircle } from "react-icons/bs";
import { FaIndustry, FaLocationArrow } from "react-icons/fa";
import { ethers } from "ethers";
import contractAddresses from "../utils/contractAddress.json";
import "../style/FactoryConfirm.css";

const tokenAddress = contractAddresses.token;
const factoryAddress = contractAddresses.factory;
const recipientAddress = "0xf5CcA82D37db8d2B0503c20f0f21A3a8eD25F4E9";
const fixedPrice = ethers.utils.parseUnits("2", 18);

const FACTORY_ABI = [
  "function createFactory(uint256 latitude, uint256 longitude, uint256 powerConsumption) external"
];

const FactoryConfirm = ({ close, lat, lng }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [powerConsumption, setPowerConsumption] = useState("100");

  useEffect(() => {
    const initWallet = async () => {
      if (!window.ethereum) return;

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Signer = web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setFactoryContract(new ethers.Contract(factoryAddress, FACTORY_ABI, web3Signer));
      setTokenContract(
        new ethers.Contract(
          tokenAddress,
          ["function transfer(address to, uint256 amount) public returns (bool)"],
          web3Signer
        )
      );

      const address = await web3Signer.getAddress();
      setCurrentAccount(address);
    };

    initWallet();

    if (window.ethereum) {
      const onAccountsChanged = (accounts) => {
        setCurrentAccount(accounts?.[0] || null);
      };
      window.ethereum.on("accountsChanged", onAccountsChanged);
      return () => window.ethereum.removeListener("accountsChanged", onAccountsChanged);
    }
  }, []);

  const handleSubmit = async () => {
    if (!factoryContract || !tokenContract || !signer) {
      setTransactionStatus("Wallet not ready. Please reconnect MetaMask.");
      return;
    }
    if (!powerConsumption || Number(powerConsumption) <= 0) {
      setTransactionStatus("Enter a valid power consumption.");
      return;
    }
    if (currentAccount && currentAccount.toLowerCase() === recipientAddress.toLowerCase()) {
      alert("You cannot register a factory to the recipient address itself!");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("Initializing transaction...");

    try {
      const intLat = Math.floor(lat * 10000);
      const intLng = Math.floor(lng * 10000);
      const intConsumption = Math.max(0, Math.floor(Number(powerConsumption) * 10000));

      setTransactionStatus("Sending SOLR tokens...");
      const paymentTx = await tokenContract.transfer(recipientAddress, fixedPrice);
      await paymentTx.wait();

      setTransactionStatus("Registering factory...");
      const tx = await factoryContract.createFactory(intLat, intLng, intConsumption);
      await tx.wait();

      setTransactionStatus("Transaction completed successfully!");
      window.dispatchEvent(new Event("chainStateUpdated"));
      setTimeout(() => {
        close();
      }, 1500);
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("Transaction failed, please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="factory-modal-overlay">
      <div className="factory-modal-content">
        <div className="factory-modal-header">
          <h2 className="factory-modal-title">Register Factory</h2>
          <button onClick={close} className="factory-close-button">×</button>
        </div>

        <div className="factory-wallet-card">
          <div className="factory-wallet-card-header">
            <div className="factory-wallet-icon">
              <SiEthereum fontSize={24} />
            </div>
            <BsInfoCircle fontSize={16} className="factory-info-icon" />
          </div>
          <div className="factory-wallet-details">
            <p className="factory-wallet-address">{formatAddress(currentAccount)}</p>
            <p className="factory-wallet-network">Ethereum Network</p>
          </div>
          <div className="factory-wallet-glow"></div>
        </div>

        <div className="factory-details">
          <h3 className="factory-section-title">
            <FaIndustry className="factory-section-icon" />
            Factory Details
          </h3>

          <div className="factory-specs">
            <div className="factory-spec-item">
              <FaLocationArrow className="factory-spec-icon" />
              <div className="factory-spec-content">
                <p className="factory-spec-label">Location</p>
                <p className="factory-spec-value">Latitude: {Math.floor(lat)}°</p>
                <p className="factory-spec-value">Longitude: {Math.floor(lng)}°</p>
              </div>
            </div>

            <div className="factory-spec-item">
              <div className="factory-spec-content">
                <p className="factory-spec-label">Power Consumption (W)</p>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={powerConsumption}
                  onChange={(e) => setPowerConsumption(e.target.value)}
                  className="factory-input"
                  placeholder="Enter consumption"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="factory-payment-section">
          <div className="factory-price-tag">
            <span className="factory-price-amount">2 SOLR</span>
            <span className="factory-price-label">Fixed price</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || !currentAccount}
            className={`factory-submit-button ${isProcessing ? "processing" : ""}`}
          >
            {isProcessing ? (
              <span className="factory-processing-text">{transactionStatus}</span>
            ) : (
              <span>Register and Pay</span>
            )}
            <span className="factory-button-glow"></span>
          </button>

          {!currentAccount && (
            <p className="factory-wallet-warning">Please connect your wallet first</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryConfirm;
