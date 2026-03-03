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
    setIsAuthorized(true); // ✅ Record authorized state
    alert("✅ Authorized: Shop contract can now transfer panels");
  } catch (error) {
    console.error("Authorization failed:", error);
    alert("❌ Authorization failed. It may already be set or you lack permission");
  }
};


  const connectWallet = async () => {
  if (!window.ethereum) return alert("Please install MetaMask");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const accounts = await provider.send("eth_requestAccounts", []);

  // ✅ Ensure account is fetched before normalization
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
      console.error("Failed to fetch panels", err);
    }
  };

  const fetchMyPurchases = async (shop, userAddress) => {
    try {
      if (!ethers.utils.isAddress(userAddress)) return;
      const history = await shop.getPurchaseHistory(userAddress);
      setPurchaseHistory(history);
    } catch (e) {
      console.error("Failed to fetch purchase history", e);
    }
  };

  const listItem = async () => {
    try {
      const panel = myPanels.find(p => p.id === newItem.panelId);
      if (!panel) return alert("Panel info not found");
      if (!newItem.name || !newItem.price) return alert("Please enter a name and price");

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
      alert("Listed successfully");
      fetchItems();
    } catch (e) {
      console.error("Listing failed", e);
      alert("Listing failed");
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
    alert("Offer submitted, waiting for seller approval");
    fetchItems(); // Refresh state
  } catch (e) {
    console.error("Offer failed", e);
    alert("Offer failed");
  }
};
const approveSale = async (id, buyer) => {
  if (!isAuthorized) {
  alert("⚠️ Shop contract not authorized. Please authorize using the button above");
  return;
}

  try {
    const item = items.find(it => it.id.toString() === id.toString());
    const [realOwner] = await panelContract.getPanel(item.panelId);

    // Normalize addresses with ethers.getAddress to avoid casing issues
    const normalizedAccount = ethers.utils.getAddress(account);
    const normalizedOwner = ethers.utils.getAddress(realOwner);

    console.log("✅ On-chain panel owner:", normalizedOwner);
    console.log("✅ Current account:", normalizedAccount);
    console.log("✅ Item seller:", item.seller);

    if (normalizedOwner !== normalizedAccount) {
      alert("You are not the actual owner of this panel and cannot approve the sale!");
      return;
    }

    const tx = await shopContract.approveSale(id, buyer);
    await tx.wait();

    alert(`Sale approved: panel transferred to ${buyer}`);
    fetchItems();
    fetchMyPurchases(shopContract, normalizedAccount);
  } catch (e) {
    console.error("Approval failed", e);
    alert("Approval failed");
  }
};

  return (
      <div className="panel-container">
        <h2>🛒 Shop Contract Test Panel</h2>
        <p>Current account: {account}</p>
        {!isAuthorized && (
  <button className="button" onClick={authorizeShopContract}>
    🔐 Authorize Shop contract to transfer panels
  </button>
)}


        <div className="panel-card">
          <h3>List my solar panels</h3>
          {myPanels.length === 0 ? <p>No panels to list</p> : myPanels.map((panel, idx) => (
              <div key={idx} className="panel-item">
                  <p>Panel ID: {panel.id}</p>
                  <p>Location: ({panel.latitude}, {panel.longitude})</p>
                  <p>Power: AC {panel.acPower}W / DC {panel.dcPower}W</p>
                  <input type="text" style={{color: "black"}} placeholder="Item name"
                       onChange={(e) => setNewItem({...newItem, name: e.target.value, panelId: panel.id})}/>
                  <input type="number" style={{color: "black"}} placeholder="Price (Token)"
                       onChange={(e) => setNewItem({...newItem, price: e.target.value})}/>
                  <button className="button" onClick={listItem}>List this panel</button>
              </div>
          ))}
        </div>

        <div className="panel-card">
          <h3>📦 All items</h3>
          {items.filter(item => !item.purchased).map((item, idx) => (
              <div key={idx} className="panel-item">
                <p>ID: {item.id?.toString?.() ?? "-"} - {item.name}</p>
                <p>Price: {item.price?.toString?.() ?? "-"} Token</p>
                <p>Location: ({item.latitude?.toString?.() ?? "-"}, {item.longitude?.toString?.() ?? "-"})</p>
                <p>Power: 🔌 AC {item.acPower?.toString?.() ?? "-"}W, ⚡ DC {item.dcPower?.toString?.() ?? "-"}W</p>
                <p>Status: {item.purchased ? "✅ Sold" : "🟠 For sale"}</p>

                {!item.purchased && (
                    <>
                      {/* Offer button (buyer view) */}
                      {!isAuthorized && (
                      <button className="button" onClick={authorizeShopContract}>
                        🔐 Authorize Shop contract to transfer panels
                      </button>
                    )}


                      {/* If current user is the seller, show pending buyers */}
                      {ethers.utils.getAddress(item.seller) === ethers.utils.getAddress(account) && (

                          <div style={{marginTop: "10px"}}>
                            <p>📝 Pending buyers:</p>
                            {item.pendingBuyers?.length === 0 ? (
                                <p>No requests</p>
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
                                          Approve sale
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
          <h3>🧾 My purchase history</h3>
          {purchaseHistory.length === 0 ? <p>No records</p> : purchaseHistory.map((p, i) => (
              <div key={i} className="panel-item">
                <p>Panel ID: {p.itemId?.toString?.() ?? "-"}</p>
                <p>Price: {p.price?.toString?.() ?? "-"} Token</p>
                <p>Time: {new Date(p.timestamp?.toNumber?.() * 1000).toLocaleString()}</p>
              </div>
          ))}
        </div>
      </div>
  );
};

export default Shop;
