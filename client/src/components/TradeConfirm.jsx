// SolarSave 交易脚本 - 中文化版本

import React, { useEffect, useState } from "react";
import { SiEthereum } from "react-icons/si";
import { BsInfoCircle, BsLightningChargeFill } from "react-icons/bs";
import { FaSolarPanel, FaLocationArrow,FaWhmcs } from "react-icons/fa";
import { ethers } from "ethers";
import SolarPanels from "../utils/SolarPanels.json";
import "../style/TradeConfirm.css";

const contractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9"; // 太阳能板合约地址
const tokenAddress = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA"; // ERC20 代币合约地址
const recipientAddress = "0x94e43e4088e92177E833FD43bF3C15fB1b629C87"; // 资金接收地址
const fixedPrice = ethers.utils.parseUnits("2", 18); // 2 ERC20 代币

const TradeConfirm = ({ close, lat, lng, batterTemp, dcPower, acPower, sandiaModuleName, cecInverterName }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(new ethers.Contract(contractAddress, SolarPanels.abi, web3Signer));
      setTokenContract(new ethers.Contract(tokenAddress, ["function transfer(address to, uint256 amount) public returns (bool)"], web3Signer));
      web3Signer.getAddress().then(setCurrentAccount);
    }
  }, []);

  const handleSubmit = async () => {
    if (!contract || !tokenContract || !signer) return;

    setIsProcessing(true);
    setTransactionStatus("正在初始化交易...");

    try {
      const intLat = Math.floor(lat * 10000);
      const intLng = Math.floor(lng * 10000);
      //   Math.round(lat * 10000), // 转换为整数以适应合约
        //   Math.round(lng * 10000),
      const intbatteryTemp = Math.floor(batterTemp * 10000);
      const intdcpower = Math.max(0,Math.floor(dcPower * 10000));
      const intacpower = Math.max(0,Math.floor(acPower * 10000));


      setTransactionStatus("正在发送 SOLR 代币...");
      const approvalTx = await tokenContract.transfer(recipientAddress, fixedPrice);
      await approvalTx.wait();

      setTransactionStatus("正在注册太阳能面板...");
      const tx = await contract.createPanel(intLat, intLng, intbatteryTemp, intdcpower, intacpower);
      await tx.wait();

      setTransactionStatus("交易成功完成！");

      setTimeout(() => {
        close(); // 关闭弹窗
      }, 1500);

    } catch (error) {
      console.error("交易失败:", error);
      setTransactionStatus("交易失败，请重试。");
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
          <h2 className="trade-modal-title">注册太阳能面板</h2>
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
            <p className="trade-wallet-network">以太坊网络</p>
          </div>
          <div className="trade-wallet-glow"></div>
        </div>

        <div className="trade-panel-details">
          <h3 className="trade-section-title">
            <FaSolarPanel className="trade-section-icon"/>
            面板信息
          </h3>

          <div className="trade-panel-specs">
            {/* 地理位置 */}
            <div className="trade-spec-item">
              <FaLocationArrow className="trade-spec-icon"/>
              <div className="trade-spec-content">
                <p className="trade-spec-label">地理位置</p>
                <p className="trade-spec-value">纬度: {Math.floor(lat)}°</p>
                <p className="trade-spec-value">经度: {Math.floor(lng)}°</p>
              </div>
            </div>

            {/* 实时预测数据 */}
            <div className="trade-spec-item">
              <FaWhmcs className="trade-spec-icon"/>
              <div className="trade-spec-content">
                <p className="trade-spec-label">实时数据</p>
                <p className="trade-spec-value">电池温度: {batterTemp}°C</p>
                <p className="trade-spec-value">直流功率: {dcPower} W</p>
                <p className="trade-spec-value">交流功率: {acPower} W</p>
              </div>
            </div>

            {/* 面板组件信息 */}
            <div className="trade-spec-item">
              <BsLightningChargeFill className="trade-spec-icon"/>
              <div className="trade-spec-content">
                <p className="trade-spec-label">面板组件</p>
                <p className="trade-spec-value">{sandiaModuleName}</p>
                <p className="trade-spec-value">{cecInverterName}</p>
              </div>
            </div>


        </div>
      </div>

      <div className="trade-payment-section">
        <div className="trade-price-tag">
          <span className="trade-price-amount">2 SOLR</span>
          <span className="trade-price-label">固定价格</span>
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
              <span>注册并支付</span>
          )}
          <span className="trade-button-glow"></span>
        </button>

        {!currentAccount && (
            <p className="trade-wallet-warning">请先连接您的钱包</p>
        )}
      </div>
    </div>
</div>
)
  ;
};

export default TradeConfirm;
