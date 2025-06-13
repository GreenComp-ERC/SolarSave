import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ShopABI from "../../utils/test/Shop.json";
import ERC20ABI from "../../utils/test/SolarToken.json";
import SolarPanelsABI from "../../utils/test/SolarPanels.json";
import "../../style/TestPanels.css";

const shopAddress = "0xb997c4257Bc9Ca4e68529A3d649D851562ca8b4c";
const tokenAddress = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e";
const panelContractAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";

const Shop = () => {
  const [account, setAccount] = useState("");
  const [shopContract, setShopContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [panelContract, setPanelContract] = useState(null);
  const [items, setItems] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);


  const [newItem, setNewItem] = useState({
    name: "",
    price: 0,
    panelId: 1
  });

  useEffect(() => {
    connectWallet();

  }, [])
  const authorizeShopContract = async () => {
  try {
    const tx = await panelContract.setShopContract(shopAddress);
    await tx.wait();
    setIsAuthorized(true); // ✅ 授权成功后记录状态
    alert("✅ 授权成功：Shop 合约已获得转移面板权限");
  } catch (error) {
    console.error("授权失败：", error);
    alert("❌ 授权失败，可能已设置或无权限");
  }
};


  const connectWallet = async () => {
  if (!window.ethereum) return alert("请安装 MetaMask");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const accounts = await provider.send("eth_requestAccounts", []);

  // ✅ 确保先拿到账户再统一格式
  const normalizedAccount = ethers.utils.getAddress(accounts[0]);
  setAccount(normalizedAccount);

  const shop = new ethers.Contract(shopAddress, ShopABI.abi, signer);
  const token = new ethers.Contract(tokenAddress, ERC20ABI.abi, signer);
  const panel = new ethers.Contract(panelContractAddress, SolarPanelsABI.abi, signer);

  setShopContract(shop);
  setTokenContract(token);
  setPanelContract(panel);
  const shopInContract = await panel.shopContract();
  if (ethers.utils.getAddress(shopInContract) === ethers.utils.getAddress(shopAddress)) {
    setIsAuthorized(true);
  }


  fetchItems(shop);
  fetchMyPurchases(shop, normalizedAccount);
  fetchMyPanels(panel);
};


  const fetchItems = async (contractInstance = shopContract) => {
  if (!contractInstance) return;
  const count = await contractInstance.itemCount();
  const fetchedItems = [];

  for (let i = 1; i <= count; i++) {
    const item = await contractInstance.getItem(i);
    const pendingBuyers = await contractInstance.getPendingBuyers(item.id);
    fetchedItems.push({ ...item, pendingBuyers });
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

  const offerToBuy = async (id, price) => {
  try {
    const allowance = await tokenContract.allowance(account, shopAddress);
    if (allowance.lt(price)) {
      const approveTx = await tokenContract.approve(shopAddress, price);
      await approveTx.wait();
    }

    const tx = await shopContract.offerToBuy(id);
    await tx.wait();
    alert("出价成功，等待卖家批准");
    fetchItems(); // 刷新状态
  } catch (e) {
    console.error("出价失败", e);
    alert("出价失败");
  }
};
const approveSale = async (id, buyer) => {
  if (!isAuthorized) {
  alert("⚠️ 尚未授权 Shop 合约控制权，请先点击上方按钮进行授权");
  return;
}

  try {
    const item = items.find(it => it.id.toString() === id.toString());
    const [realOwner] = await panelContract.getPanel(item.panelId);

    // 使用 ethers.getAddress 标准化地址，解决大小写不一致问题
    const normalizedAccount = ethers.utils.getAddress(account);
    const normalizedOwner = ethers.utils.getAddress(realOwner);

    console.log("✅ 当前链上面板所有者:", normalizedOwner);
    console.log("✅ 当前账户:", normalizedAccount);
    console.log("✅ 商品卖家 seller:", item.seller);

    if (normalizedOwner !== normalizedAccount) {
      alert("你不是该面板的实际拥有者，无法批准交易！");
      return;
    }

    const tx = await shopContract.approveSale(id, buyer);
    await tx.wait();

    alert(`交易成功：面板转移给 ${buyer}`);
    fetchItems();
    fetchMyPurchases(shopContract, normalizedAccount);
  } catch (e) {
    console.error("批准失败", e);
    alert("批准失败");
  }
};

  return (
      <div className="panel-container">
        <h2>🛒 Shop 合约测试面板</h2>
        <p>当前账户: {account}</p>
        {!isAuthorized && (
  <button className="button" onClick={authorizeShopContract}>
    🔐 授权 Shop 合约控制面板转移
  </button>
)}


        <div className="panel-card">
          <h3>上架我的太阳能板</h3>
          {myPanels.length === 0 ? <p>无面板可上架</p> : myPanels.map((panel, idx) => (
              <div key={idx} className="panel-item">
                <p>面板ID: {panel.id}</p>
                <p>位置: ({panel.latitude}, {panel.longitude})</p>
                <p>功率: AC {panel.acPower}W / DC {panel.dcPower}W</p>
                <input type="text" style={{color: "black"}} placeholder="商品名"
                       onChange={(e) => setNewItem({...newItem, name: e.target.value, panelId: panel.id})}/>
                <input type="number" style={{color: "black"}} placeholder="价格 (Token)"
                       onChange={(e) => setNewItem({...newItem, price: e.target.value})}/>
                <button className="button" onClick={listItem}>上架该面板</button>
              </div>
          ))}
        </div>

        <div className="panel-card">
          <h3>📦 所有商品</h3>
          {items.filter(item => !item.purchased).map((item, idx) => (
              <div key={idx} className="panel-item">
                <p>ID: {item.id?.toString?.() ?? "-"} - {item.name}</p>
                <p>价格: {item.price?.toString?.() ?? "-"} Token</p>
                <p>位置: ({item.latitude?.toString?.() ?? "-"}, {item.longitude?.toString?.() ?? "-"})</p>
                <p>功率: 🔌 AC {item.acPower?.toString?.() ?? "-"}W, ⚡ DC {item.dcPower?.toString?.() ?? "-"}W</p>
                <p>状态: {item.purchased ? "✅ 已售出" : "🟠 待售"}</p>

                {!item.purchased && (
                    <>
                      {/* 出价按钮（买家可见） */}
                      {!isAuthorized && (
                      <button className="button" onClick={authorizeShopContract}>
                        🔐 授权 Shop 合约控制面板转移
                      </button>
                    )}


                      {/* 当前用户是卖家时，显示待批准买家列表 */}
                      {ethers.utils.getAddress(item.seller) === ethers.utils.getAddress(account) && (

                          <div style={{marginTop: "10px"}}>
                            <p>📝 待审批买家：</p>
                            {item.pendingBuyers?.length === 0 ? (
                                <p>暂无申请</p>
                            ) : (
                                <ul>
                                  {item.pendingBuyers.map((buyer, i) => (
                                      <li key={i}>
                                        {buyer}
                                        <button
                                            className="button"
                                            style={{marginLeft: "10px"}}
                                            onClick={() => approveSale(item.id, buyer)}
                                        >
                                          同意交易
                                        </button>
                                      </li>
                                  ))}
                                </ul>
                            )}
                          </div>
                      )}
                    </>
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
