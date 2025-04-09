import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "../style/SolarToken.css"; // ✅ 引入 CSS 样式

const SOLAR_TOKEN_ADDRESS = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA"; // 你的合约地址
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) public returns (bool)"
];

const Wallet = () => {
    const [account, setAccount] = useState("");
    const [balance, setBalance] = useState("0");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        connectWallet();
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("请安装 MetaMask!");
            return;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        setAccount(accounts[0]);
        fetchBalance(accounts[0], provider);
    };

    const fetchBalance = async (address, provider) => {
        const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, provider);
        const balance = await contract.balanceOf(address);
        setBalance(ethers.utils.formatEther(balance));
    };

    const sendToken = async () => {
        if (!recipient || !amount) {
            alert("请输入接收地址和金额");
            return;
        }
        if (!ethers.utils.isAddress(recipient)) {
            alert("无效的钱包地址");
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, signer);

        try {
            const tx = await contract.transfer(recipient, ethers.utils.parseEther(amount));
            await tx.wait();
            alert(`✅ 成功发送 ${amount} SOLR 到 ${recipient}`);
            fetchBalance(account, provider);
        } catch (error) {
            console.error("转账失败:", error);
        }
    };

    return (
        <div className="solar-token-container">
            <h2>🦁 SolarToken 钱包</h2>

            <div className="wallet-info">
                <p>🟢 连接的钱包:</p>
                <p className="wallet-address">{account}</p>
                <p className="solar-balance">💰 SOLR 余额: {balance} SOLR</p>
            </div>

            <div className="input-container">
                <input type="text" placeholder="接收者地址" onChange={(e) => setRecipient(e.target.value)} />
                <input type="number" placeholder="发送数量" onChange={(e) => setAmount(e.target.value)} />
                <button className="button send-button" onClick={sendToken}>发送 SOLR</button>
            </div>
        </div>
    );
};

export default Wallet;
