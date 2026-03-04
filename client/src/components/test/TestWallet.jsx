import React, { useState, useEffect } from "react";
import { Sun, Send, Wallet as WalletIcon, Loader, Copy, Check } from "lucide-react";
import { ethers } from "ethers";
import '../../style/Wallet.css';
import contractAddresses from "../../utils/contractAddress.json";

// Mock ethers for demo display
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

// Use ethers in production instead of mockEthers


const SOLAR_TOKEN_ADDRESS = contractAddresses.token;
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
        alert("Please install MetaMask!");
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
      console.error("Failed to connect wallet:", error);
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
      console.error("Failed to fetch balance:", error);
    }
  };

  const sendToken = async () => {
    if (!recipient || !amount) {
      alert("Please enter a recipient address and amount");
      return;
    }
    if (!ethers.utils.isAddress(recipient)) {
      alert("Invalid wallet address");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, signer);

      const tx = await contract.transfer(recipient, ethers.utils.parseEther(amount));
      await tx.wait();

      // Update transaction history
      setTxHistory([
        {
          recipient,
          amount,
          timestamp: new Date().toLocaleString()
        },
        ...txHistory
      ]);

      // Clear input fields
      setRecipient("");
      setAmount("");

      // Update balance
      fetchBalance(account, provider);
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const mintToken = async () => {
  if (!mintAddress || !mintAmount) {
    alert("Please enter an address and amount");
    return;
  }
  if (!ethers.utils.isAddress(mintAddress)) {
    alert("Invalid address");
    return;
  }

  setIsMinting(true);
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(SOLAR_TOKEN_ADDRESS, ERC20_ABI, signer);

    const tx = await contract.mint(mintAddress, ethers.utils.parseEther(mintAmount));
    await tx.wait();

    alert("Mint successful!");
    fetchBalance(account, provider);
  } catch (err) {
    console.error("Mint failed:", err);
    alert("Mint failed, you may not be the contract owner");
  } finally {
    setIsMinting(false);
  }
};


  // Address formatting
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="wallet-header">
        <Sun className="wallet-sun-icon" />
        <h1 className="wallet-title">
          SolarToken Wallet
        </h1>
      </div>

      {/* Account info */}
      <div className="wallet-content">
        {account ? (
          <div className="wallet-account-info">
            <div className="wallet-connection-status">
              <div className="wallet-status-indicator">
                <div className="wallet-status-dot"></div>
                <span className="wallet-status-text">Connected</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="wallet-copy-btn"
              >
                {isCopied ? <Check size={14} className="wallet-copy-icon" /> : <Copy size={14} className="wallet-copy-icon" />}
                {isCopied ? "Copied" : "Copy address"}
              </button>
            </div>

            <div className="wallet-address">
              {account}
            </div>

            <div className="wallet-balance">
              <span className="wallet-balance-label">SOLR Balance:</span>
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
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
      {/* Minting section (admin only) */}
    {account && isOwner &&(
      <div className="wallet-transfer-section">
        <h2 className="wallet-section-title">Mint SOLR (Admin)</h2>
        <div className="wallet-form">
          <div className="wallet-input-group">
            <label className="wallet-label">Recipient address</label>
            <input
              type="text"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="0x..."
              className="wallet-input"
            />
          </div>

          <div className="wallet-input-group">
            <label className="wallet-label">Amount</label>
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
            {isMinting ? "Minting..." : "Mint SOLR"}
          </button>
        </div>
      </div>
    )}


      {/* Transfer */}
      {account && (
        <div className="wallet-transfer-section">
          <h2 className="wallet-section-title">Send SOLR</h2>

          <div className="wallet-form">
            <div className="wallet-input-group">
              <label className="wallet-label">Recipient address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="wallet-input"
              />
            </div>

            <div className="wallet-input-group">
              <label className="wallet-label">Amount</label>
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
              {isLoading ? "Processing..." : "Send SOLR"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      {account && txHistory.length > 0 && (
        <div className="wallet-history-section">
          <h2 className="wallet-section-title">Recent Transactions</h2>
          <div className="wallet-history-list">
            {txHistory.map((tx, index) => (
              <div key={index} className="wallet-history-item">
                <div className="wallet-history-header">
                  <span className="wallet-history-time">{tx.timestamp}</span>
                  <span className="wallet-history-amount">{tx.amount} SOLR</span>
                </div>
                <div className="wallet-history-address">
                  Sent to: {formatAddress(tx.recipient)}
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