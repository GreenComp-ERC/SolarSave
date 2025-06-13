import React, { useState, useEffect } from "react";
import { Sun, Send, Wallet as WalletIcon, Loader, Copy, Check } from "lucide-react";
import { ethers } from "ethers";
import '../../style/Wallet.css';

// 模拟 ethers 以便在示例中显示
const mockEthers = {
  providers: {
    Web3Provider: class {
      getSigner() { return {}; }
    }
  },
  Contract: class {
    constructor() {
      this.balanceOf = async () => "1000000000000000000";
      this.transfer = async () => ({ wait: async () => {} });
    }
  },

};

// 在实际应用中使用 ethers 而不是 mockEthers


const SOLAR_TOKEN_ADDRESS = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e";
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
    "function mint(address to, uint256 amount) public",
    "function owner() view returns (address)",


];

const TestWallet = () => {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [txHistory, setTxHistory] = useState([]);
  const [mintAddress, setMintAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);




  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) {
        alert("请安装 MetaMask!");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      setAccount(accounts[0]);
      fetchBalance(accounts[0], provider);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, signer);
      const contractOwner = await contract.owner();

      setIsOwner(accounts[0].toLowerCase() === contractOwner.toLowerCase());


    } catch (error) {
      console.error("连接钱包失败:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalance = async (address, provider) => {
    try {
      const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await contract.balanceOf(address);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("获取余额失败:", error);
    }
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

    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, signer);

      const tx = await contract.transfer(recipient, ethers.utils.parseEther(amount));
      await tx.wait();

      // 更新交易历史
      setTxHistory([
        {
          recipient,
          amount,
          timestamp: new Date().toLocaleString()
        },
        ...txHistory
      ]);

      // 清空输入字段
      setRecipient("");
      setAmount("");

      // 更新余额
      fetchBalance(account, provider);
    } catch (error) {
      console.error("转账失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const mintToken = async () => {
  if (!mintAddress || !mintAmount) {
    alert("请输入地址和数量");
    return;
  }
  if (!ethers.utils.isAddress(mintAddress)) {
    alert("无效地址");
    return;
  }

  setIsMinting(true);
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, signer);

    const tx = await contract.mint(mintAddress, ethers.utils.parseEther(mintAmount));
    await tx.wait();

    alert("铸币成功！");
    fetchBalance(account, provider);
  } catch (err) {
    console.error("铸币失败:", err);
    alert("铸币失败，可能不是合约 owner");
  } finally {
    setIsMinting(false);
  }
};


  // 地址格式化
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="wallet-container">
      {/* 标题区域 */}
      <div className="wallet-header">
        <Sun className="wallet-sun-icon" />
        <h1 className="wallet-title">
          SolarToken 钱包
        </h1>
      </div>

      {/* 账户信息 */}
      <div className="wallet-content">
        {account ? (
          <div className="wallet-account-info">
            <div className="wallet-connection-status">
              <div className="wallet-status-indicator">
                <div className="wallet-status-dot"></div>
                <span className="wallet-status-text">已连接</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="wallet-copy-btn"
              >
                {isCopied ? <Check size={14} className="wallet-copy-icon" /> : <Copy size={14} className="wallet-copy-icon" />}
                {isCopied ? "已复制" : "复制地址"}
              </button>
            </div>

            <div className="wallet-address">
              {account}
            </div>

            <div className="wallet-balance">
              <span className="wallet-balance-label">SOLR 余额:</span>
              <div className="wallet-balance-value">
                <Sun className="wallet-balance-icon" />
                <span className="wallet-balance-amount">{balance}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="wallet-connect-btn"
          >
            {isConnecting ? (
              <Loader className="wallet-btn-icon wallet-spin" />
            ) : (
              <WalletIcon className="wallet-btn-icon" />
            )}
            {isConnecting ? "连接中..." : "连接钱包"}
          </button>
        )}
      </div>
      {/* 铸币区域（仅管理员可用） */}
    {account && isOwner &&(
      <div className="wallet-transfer-section">
        <h2 className="wallet-section-title">铸造 SOLR（管理员）</h2>
        <div className="wallet-form">
          <div className="wallet-input-group">
            <label className="wallet-label">接收地址</label>
            <input
              type="text"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="0x..."
              className="wallet-input"
            />
          </div>

          <div className="wallet-input-group">
            <label className="wallet-label">数量</label>
            <div className="wallet-amount-input">
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="0.0"
                className="wallet-input"
              />
              <span className="wallet-currency">SOLR</span>
            </div>
          </div>

          <button
            onClick={mintToken}
            disabled={isMinting || !mintAddress || !mintAmount}
            className={`wallet-send-btn ${isMinting || !mintAddress || !mintAmount ? 'wallet-btn-disabled' : ''}`}
          >
            {isMinting ? (
              <Loader className="wallet-btn-icon wallet-spin" />
            ) : (
              <Send className="wallet-btn-icon" />
            )}
            {isMinting ? "铸造中..." : "铸造 SOLR"}
          </button>
        </div>
      </div>
    )}


      {/* 转账区域 */}
      {account && (
        <div className="wallet-transfer-section">
          <h2 className="wallet-section-title">发送 SOLR</h2>

          <div className="wallet-form">
            <div className="wallet-input-group">
              <label className="wallet-label">接收地址</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="wallet-input"
              />
            </div>

            <div className="wallet-input-group">
              <label className="wallet-label">数量</label>
              <div className="wallet-amount-input">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="wallet-input"
                />
                <span className="wallet-currency">SOLR</span>
              </div>
            </div>

            <button
              onClick={sendToken}
              disabled={isLoading || !recipient || !amount}
              className={`wallet-send-btn ${isLoading || !recipient || !amount ? 'wallet-btn-disabled' : ''}`}
            >
              {isLoading ? (
                <Loader className="wallet-btn-icon wallet-spin" />
              ) : (
                <Send className="wallet-btn-icon" />
              )}
              {isLoading ? "处理中..." : "发送 SOLR"}
            </button>
          </div>
        </div>
      )}

      {/* 交易历史 */}
      {account && txHistory.length > 0 && (
        <div className="wallet-history-section">
          <h2 className="wallet-section-title">最近交易</h2>
          <div className="wallet-history-list">
            {txHistory.map((tx, index) => (
              <div key={index} className="wallet-history-item">
                <div className="wallet-history-header">
                  <span className="wallet-history-time">{tx.timestamp}</span>
                  <span className="wallet-history-amount">{tx.amount} SOLR</span>
                </div>
                <div className="wallet-history-address">
                  发送至: {formatAddress(tx.recipient)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestWallet;