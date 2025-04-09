import React, { useEffect, useState } from "react";
import { SiEthereum } from "react-icons/si";
import { BsInfoCircle } from "react-icons/bs";
import { ethers } from "ethers";
import SolarPanels from "../utils/SolarPanels.json";
import "../style/TradeScript.css";

const contractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9"; // 太阳能板合约地址
const tokenAddress = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA"; // ERC20 代币合约地址
const recipientAddress = "0x94e43e4088e92177E833FD43bF3C15fB1b629C87"; // 资金接收地址
const fixedPrice = ethers.utils.parseUnits("2", 18); // 2 ERC20 代币

const TradeScript = ({ close, lat, lng, sandiaModuleName, cecInverterName }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

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
    try {
      // 将坐标转换为整数
      const intLat = Math.floor(lat);
      const intLng = Math.floor(lng);

      // 发送 ERC20 代币
      const approvalTx = await tokenContract.transfer(recipientAddress, fixedPrice);
      await approvalTx.wait();

      // 创建太阳能板
      const tx = await contract.createPanel(intLat, intLng, 25, 100, 90);
      await tx.wait();

      close(); // 交易完成后立刻关闭弹窗
    } catch (error) {
      console.error("交易失败:", error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="p-3 flex justify-end items-start flex-col rounded-xl h-40 w-full my-5 eth-card white-glassmorphism">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-full border-2 border-white flex justify-center items-center">
              <SiEthereum fontSize={21} color="#fff" />
            </div>
            <BsInfoCircle fontSize={17} color="#fff" />
          </div>
          <div>
            <p className="text-white font-light text-sm">{currentAccount}</p>
            <p className="text-white font-semibold text-lg mt-1">Ethereum</p>
          </div>
        </div>

        <div className="panel-details p-5 w-full blue-glassmorphism">
          <h3 className="text-white text-center font-semibold text-lg mb-2">Solar Panel Details</h3>
          <p className="text-white text-sm"><strong>Latitude:</strong> {Math.floor(lat)}</p>
          <p className="text-white text-sm"><strong>Longitude:</strong> {Math.floor(lng)}</p>
          <p className="text-white text-sm"><strong>Sandia Module:</strong> {sandiaModuleName}</p>
          <p className="text-white text-sm"><strong>CEC Inverter:</strong> {cecInverterName}</p>
        </div>

        <div className="p-5 w-full flex flex-col justify-start items-center blue-glassmorphism">
          <p className="text-white">Fixed Price: 2 SOLR</p>
          <div className="h-[1px] w-full bg-gray-400 my-2" />

          <button
            type="button"
            onClick={handleSubmit}
            className="text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] hover:bg-[#3d4f7c] rounded-full cursor-pointer"
          >
            Pay & Register
          </button>
        </div>

        <button onClick={close} className="close-modal-button">Close</button>
      </div>
    </div>
  );
};

export default TradeScript;
