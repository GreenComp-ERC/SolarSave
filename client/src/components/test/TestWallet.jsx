import React, { useState, useEffect } from "react";
import { Sun, Send, Wallet as WalletIcon, Loader, Copy, Check } from "lucide-react";

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
  utils: {
    formatEther: (val) => "1.0",
    parseEther: (val) => val,
    isAddress: (addr) => addr.startsWith("0x")
  }
};

// 在实际应用中使用 ethers 而不是 mockEthers
const ethers = window.ethers || mockEthers;

const SOLAR_TOKEN_ADDRESS = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA";
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)"
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

  // 地址格式化
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 shadow-2xl text-white">
      {/* 标题区域 */}
      <div className="flex items-center justify-center mb-6 space-x-2">
        <Sun className="text-yellow-400 animate-pulse w-8 h-8" />
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
          SolarToken 钱包
        </h1>
      </div>

      {/* 账户信息 */}
      <div className="w-full">
        {account ? (
          <div className="flex flex-col w-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                <span className="text-sm text-slate-300">已连接</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center text-xs text-slate-300 hover:text-white transition-colors"
              >
                {isCopied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {isCopied ? "已复制" : "复制地址"}
              </button>
            </div>

            <div className="font-mono text-sm break-all mb-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
              {account}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">SOLR 余额:</span>
              <div className="flex items-center">
                <Sun className="text-yellow-400 w-4 h-4 mr-1" />
                <span className="text-xl font-bold">{balance}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-3 px-6 rounded-xl text-white font-medium transition-all duration-200 mb-6"
          >
            {isConnecting ? (
              <Loader className="animate-spin mr-2 h-5 w-5" />
            ) : (
              <WalletIcon className="mr-2 h-5 w-5" />
            )}
            {isConnecting ? "连接中..." : "连接钱包"}
          </button>
        )}
      </div>

      {/* 转账区域 */}
      {account && (
        <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <h2 className="text-lg font-medium mb-4">发送 SOLR</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">接收地址</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">数量</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">SOLR</span>
              </div>
            </div>

            <button
              onClick={sendToken}
              disabled={isLoading || !recipient || !amount}
              className={`flex items-center justify-center w-full py-3 px-6 rounded-xl text-white font-medium transition-all duration-200 ${
                isLoading || !recipient || !amount
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
              }`}
            >
              {isLoading ? (
                <Loader className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isLoading ? "处理中..." : "发送 SOLR"}
            </button>
          </div>
        </div>
      )}

      {/* 交易历史 */}
      {account && txHistory.length > 0 && (
        <div className="w-full mt-6 bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <h2 className="text-lg font-medium mb-4">最近交易</h2>
          <div className="space-y-3 max-h-36 overflow-y-auto pr-2">
            {txHistory.map((tx, index) => (
              <div key={index} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{tx.timestamp}</span>
                  <span className="text-sm font-medium text-yellow-500">{tx.amount} SOLR</span>
                </div>
                <div className="text-xs text-slate-300 truncate">
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