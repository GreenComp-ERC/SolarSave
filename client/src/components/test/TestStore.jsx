import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ShopABI from "../../utils/test/Shop.json";
import ERC20ABI from "../../utils/test/SolarToken.json";
import SolarPanelsABI from "../../utils/test/SolarPanels.json";
import "../../style/TestPanels.css";

const shopAddress = "0x079af5ff25fB0848e622DF09562ee8b8Bd387c04";
const tokenAddress = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA";
const panelContractAddress = "0x000b697FD091585bBA0C1e3f92c8Ba4A3Cc15B3d";

const Shop = () => {
  const [account, setAccount] = useState("");
  const [shopContract, setShopContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [panelContract, setPanelContract] = useState(null);
  const [items, setItems] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: 0,
    panelId: 1
  });

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("请安装 MetaMask");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);

    const shop = new ethers.Contract(shopAddress, ShopABI.abi, signer);
    const token = new ethers.Contract(tokenAddress, ERC20ABI.abi, signer);
    const panel = new ethers.Contract(panelContractAddress, SolarPanelsABI.abi, signer);

    setShopContract(shop);
    setTokenContract(token);
    setPanelContract(panel);

    fetchItems(shop);
    fetchMyPurchases(shop, accounts[0]);
    fetchMyPanels(panel);
  };

  const fetchItems = async (contractInstance = shopContract) => {
    if (!contractInstance) return;
    const count = await contractInstance.itemCount();
    const fetchedItems = [];
    for (let i = 1; i <= count; i++) {
      const item = await contractInstance.getItem(i);
      fetchedItems.push(item);
    }
    setItems(fetchedItems);
  };

  const fetchMyPanels = async (panel) => {
    try {
      const panels = await panel.getMyPanels();
      const parsed = panels.map(p => ({
        id: p.id?.toNumber?.() ?? 0,
        owner: p.owner,
        latitude: p.latitude?.toNumber?.() ?? 0,
        longitude: p.longitude?.toNumber?.() ?? 0,
        batteryTemperature: p.batteryTemperature?.toNumber?.() ?? 0,
        dcPower: p.dcPower?.toNumber?.() ?? 0,
        acPower: p.acPower?.toNumber?.() ?? 0,
        createdAt: p.createdAt?.toNumber?.() ?? 0,
      }));
      setMyPanels(parsed);
    } catch (err) {
      console.error("获取面板失败", err);
    }
  };

  const fetchMyPurchases = async (shop, userAddress) => {
    try {
      if (!ethers.utils.isAddress(userAddress)) return;
      const history = await shop.getPurchaseHistory(userAddress);
      setPurchaseHistory(history);
    } catch (e) {
      console.error("获取购买记录失败", e);
    }
  };

  const listItem = async () => {
    try {
      const panel = myPanels.find(p => p.id === newItem.panelId);
      if (!panel) return alert("未找到对应面板信息");
      if (!newItem.name || !newItem.price) return alert("请输入名称和价格");

      const tx = await shopContract.listItem(
        newItem.name,
        ethers.BigNumber.from(newItem.price.toString()),
        panel.latitude,
        panel.longitude,
        panel.batteryTemperature,
        panel.dcPower,
        panel.acPower,
        panel.createdAt,
        panel.id
      );
      await tx.wait();
      alert("上架成功");
      fetchItems();
    } catch (e) {
      console.error("上架失败", e);
      alert("上架失败");
    }
  };

  const buyItem = async (id, price) => {
    try {
      const approveTx = await tokenContract.approve(shopAddress, price);
      await approveTx.wait();

      const tx = await shopContract.buyItem(id);
      await tx.wait();
      alert("购买成功");
      fetchItems();
      fetchMyPurchases(shopContract, account);
    } catch (e) {
      console.error("购买失败", e);
      alert("购买失败");
    }
  };

  return (
    <div className="panel-container">
      <h2>🛒 Shop 合约测试面板</h2>
      <p>当前账户: {account}</p>

      <div className="panel-card">
        <h3>上架我的太阳能板</h3>
        {myPanels.length === 0 ? <p>无面板可上架</p> : myPanels.map((panel, idx) => (
          <div key={idx} className="panel-item">
            <p>面板ID: {panel.id}</p>
            <p>位置: ({panel.latitude}, {panel.longitude})</p>
            <p>功率: AC {panel.acPower}W / DC {panel.dcPower}W</p>
            <input type="text" style={{ color: "black" }} placeholder="商品名" onChange={(e) => setNewItem({ ...newItem, name: e.target.value, panelId: panel.id })} />
            <input type="number" style={{ color: "black" }} placeholder="价格 (Token)" onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
            <button className="button" onClick={listItem}>上架该面板</button>
          </div>
        ))}
      </div>

      <div className="panel-card">
        <h3>📦 所有商品</h3>
        {items.map((item, idx) => (
          <div key={idx} className="panel-item">
            <p>ID: {item.id?.toString?.() ?? "-"} - {item.name}</p>
            <p>价格: {item.price?.toString?.() ?? "-"} Token</p>
            <p>位置: ({item.latitude?.toString?.() ?? "-"}, {item.longitude?.toString?.() ?? "-"})</p>
            <p>功率: 🔌 AC {item.acPower?.toString?.() ?? "-"}W, ⚡ DC {item.dcPower?.toString?.() ?? "-"}W</p>
            <p>状态: {item.purchased ? "✅ 已售出" : "🟠 待售"}</p>
            {!item.purchased && (
              <button className="button" onClick={() => buyItem(item.id?.toString?.(), item.price?.toString?.())}>购买</button>
            )}
          </div>
        ))}
      </div>

      <div className="panel-card">
        <h3>🧾 我的购买记录</h3>
        {purchaseHistory.length === 0 ? <p>暂无记录</p> : purchaseHistory.map((p, i) => (
          <div key={i} className="panel-item">
            <p>面板 ID: {p.itemId?.toString?.() ?? "-"}</p>
            <p>价格: {p.price?.toString?.() ?? "-"} Token</p>
            <p>时间: {new Date(p.timestamp?.toNumber?.() * 1000).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
