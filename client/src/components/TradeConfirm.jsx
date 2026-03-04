// SolarSave trade script

import React, { useEffect, useState } from "react";
import { SiEthereum } from "react-icons/si";
import { BsInfoCircle, BsLightningChargeFill } from "react-icons/bs";
import { FaSolarPanel, FaLocationArrow,FaWhmcs } from "react-icons/fa";
import { ethers } from "ethers";
// import SolarPanels from "../utils/SolarPanels.json";
import "../style/TradeConfirm.css";
import SolarPanels from "../utils/test/SolarPanels.json";
import contractAddresses from "../utils/contractAddress.json";
// const contractAddress = "0xF18dcE37a1736D18D2734c5611EE9433d8D9c2F2"; // Solar panel contract address
const tokenAddress = contractAddresses.token; // ERC20 token contract address
const recipientAddress = "0xf5CcA82D37db8d2B0503c20f0f21A3a8eD25F4E9"; // Funds recipient address
const fixedPrice = ethers.utils.parseUnits("2", 18); // 2 ERC20 tokens
const contractAddress = contractAddresses.solarPanels;
const TradeConfirm = ({ close, lat, lng, batterTemp, dcPower, acPower, sandiaModuleName, cecInverterName }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");

  useEffect(() => {
    const initWallet = async () => {
      if (!window.ethereum) return;

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Signer = web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(new ethers.Contract(contractAddress, SolarPanels.abi, web3Signer));
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
    if (!contract || !tokenContract || !signer) {
      setTransactionStatus("Wallet not ready. Please reconnect MetaMask.");
      return;
    }
    if (currentAccount && currentAccount.toLowerCase() === recipientAddress.toLowerCase()) {
    alert("You cannot register a panel to the recipient address itself!");
    return;
  }
    setIsProcessing(true);
    setTransactionStatus("Initializing transaction...");

    try {
      const intLat = Math.floor(lat * 10000);
      const intLng = Math.floor(lng * 10000);
      //   Math.round(lat * 10000), // Convert to integers to fit contract
        //   Math.round(lng * 10000),
      const intbatteryTemp = Math.floor(batterTemp * 10000);
      const intdcpower = Math.max(0,Math.floor(dcPower * 10000));
      const intacpower = Math.max(0,Math.floor(acPower * 10000));


      setTransactionStatus("Sending SOLR tokens...");
      const approvalTx = await tokenContract.transfer(recipientAddress, fixedPrice);
      await approvalTx.wait();



      setTransactionStatus("Registering solar panel...");
      const tx = await contract.createPanel(intLat, intLng, intbatteryTemp, intdcpower, intacpower);
      await tx.wait();

      setTransactionStatus("Transaction completed successfully!");

      setTimeout(() => {
        close(); // Close modal
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
    <div className="trade-modal-overlay">
      <div className="trade-modal-content">
        <div className="trade-modal-header">
          <h2 className="trade-modal-title">Register Solar Panel</h2>
          <button onClick={close} className="trade-close-button">×</button>
        </div>

        <div className="trade-wallet-card">
          <div className="trade-wallet-card-header">
            <div className="trade-wallet-icon">
              <SiEthereum fontSize={24} />
            </div>
            <BsInfoCircle fontSize={16} className="trade-info-icon" />
          </div>
          <div className="trade-wallet-details">
            <p className="trade-wallet-address">{formatAddress(currentAccount)}</p>
            <p className="trade-wallet-network">Ethereum Network</p>
          </div>
          <div className="trade-wallet-glow"></div>
        </div>

        <div className="trade-panel-details">
          <h3 className="trade-section-title">
            <FaSolarPanel className="trade-section-icon"/>
            Panel Details
          </h3>

          <div className="trade-panel-specs">
            {/* Location */}
            <div className="trade-spec-item">
              <FaLocationArrow className="trade-spec-icon"/>
              <div className="trade-spec-content">
                <p className="trade-spec-label">Location</p>
                <p className="trade-spec-value">Latitude: {Math.floor(lat)}°</p>
                <p className="trade-spec-value">Longitude: {Math.floor(lng)}°</p>
              </div>
            </div>

            {/* Live data */}
            <div className="trade-spec-item">
              <FaWhmcs className="trade-spec-icon"/>
              <div className="trade-spec-content">
                <p className="trade-spec-label">Live Data</p>
                <p className="trade-spec-value">Battery Temp: {batterTemp}°C</p>
                <p className="trade-spec-value">DC Power: {dcPower} W</p>
                <p className="trade-spec-value">AC Power: {acPower} W</p>
              </div>
            </div>

            {/* Panel components */}
            <div className="trade-spec-item">
              <BsLightningChargeFill className="trade-spec-icon"/>
              <div className="trade-spec-content">
                <p className="trade-spec-label">Panel Components</p>
                <p className="trade-spec-value">{sandiaModuleName}</p>
                <p className="trade-spec-value">{cecInverterName}</p>
              </div>
            </div>


        </div>
      </div>

      <div className="trade-payment-section">
        <div className="trade-price-tag">
          <span className="trade-price-amount">2 SOLR</span>
          <span className="trade-price-label">Fixed price</span>
        </div>

        <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || !currentAccount}
            className={`trade-submit-button ${isProcessing ? 'processing' : ''}`}
        >
          {isProcessing ? (
              <span className="trade-processing-text">{transactionStatus}</span>
          ) : (
              <span>Register and Pay</span>
          )}
          <span className="trade-button-glow"></span>
        </button>

        {!currentAccount && (
            <p className="trade-wallet-warning">Please connect your wallet first</p>
        )}
      </div>
    </div>
</div>
)
  ;
};

export default TradeConfirm;
