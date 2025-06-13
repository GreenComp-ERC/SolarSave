import React, { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { TransactionContext } from "../context/TransactionContext";
import dummyData from "../utils/dummyData";
import { shortenAddress } from "../utils/shortenAddress";
import SolarToken from "../utils/test/SolarToken.json";
import Shop from "../utils/test/Shop.json";
import SolarPanels from "../utils/test/SolarPanels.json";
import "../style/Transactions.css"; // 引入CSS文件
const tokenAddress = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e";
const shopContractAddress = "0xb997c4257Bc9Ca4e68529A3d649D851562ca8b4c";
const solarPanelsContractAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";

// 太阳能面板卡片组件
const PanelCard = ({ id, latitude, longitude, batteryTemp, dcPower, acPower, createdAt, owner, price, name, isMine, onList, onBuy, onCancel }) => {

  // 计算电量百分比（假设最大1000W）
  const dcPowerPercentage = Math.min(100, (dcPower / 1000) * 100);
  const acPowerPercentage = Math.min(100, (acPower / 1000) * 100);
  const isActive = dcPower > 0 && acPower > 0;



  return (
      <div className="trans-panel-card">
        <div className="trans-card-header">
          <div className="trans-panel-name-section">
            <h3 className="trans-panel-title">{name}</h3>
            <div className="trans-panel-id">#{id}</div>
          </div>

          <div className="trans-status-indicator">
            <div className={`trans-status-dot ${isActive ? 'trans-status-active' : 'trans-status-inactive'}`}></div>
            <span className="trans-status-text">{isActive ? '在线' : '离线'}</span>
          </div>
        </div>

        <div className="trans-performance-section">
          <div className="trans-performance-header">
            <span className="trans-performance-title">实时性能</span>
            <div className="trans-price-badge">{isNaN(price) ? price : `${price} SOLR`}</div>
          </div>

          <div className="trans-metrics-grid">
            <div className="trans-metric-item">
              <div className="trans-metric-label">位置坐标</div>
              <div className="trans-metric-value">{latitude}°, {longitude}°</div>
            </div>

            <div className="trans-metric-item">
              <div className="trans-metric-label">电池温度</div>
              <div className="trans-metric-value trans-temp-value">{batteryTemp}°C</div>
            </div>
          </div>

          <div className="trans-power-section">
            <div className="trans-power-item">
              <div className="trans-power-header">
                <span className="trans-power-label">直流功率</span>
                <span className="trans-power-value">{dcPower} W</span>
              </div>
              <div className="trans-power-bar">
                <div className="trans-power-fill trans-dc-fill" style={{width: `${dcPowerPercentage}%`}}></div>
              </div>
            </div>

            <div className="trans-power-item">
              <div className="trans-power-header">
                <span className="trans-power-label">交流功率</span>
                <span className="trans-power-value">{acPower} W</span>
              </div>
              <div className="trans-power-bar">
                <div className="trans-power-fill trans-ac-fill" style={{width: `${acPowerPercentage}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="trans-card-footer">
          <div className="trans-footer-info">
            <div className="trans-info-item">
              <span className="trans-info-label">创建时间</span>
              <span className="trans-info-value">{createdAt}</span>
            </div>
            <div className="trans-info-item">
              <span className="trans-info-label">所有者</span>
              <span className="trans-info-value trans-owner-address">{shortenAddress(owner)}</span>
            </div>
          </div>

          {/* 操作按钮区 */}
          {isMine ? (
  <>
    {price === "未上架" && (
      <button
        onClick={() => onList(id)}
        className="trans-action-button trans-list-button"
      >
        <span className="trans-button-icon">⚡</span>
        上架出售
      </button>
    )}

    {price === "已上架" && (
      <button
        onClick={() => onCancel(id)}
        className="trans-action-button trans-cancel-button"
      >
        <span className="trans-button-icon">❌</span>
        下架
      </button>
    )}
  </>
) : (
  <button
    onClick={() => onBuy(id, price)}
    className="trans-action-button trans-list-button"
  >
    <span className="trans-button-icon">💰</span>
    购买
  </button>
)}

        </div>

      </div>
  );
};

// 加载占位组件
const LoadingCard = () => (
    <div className="trans-panel-card trans-loading-card">
      <div className="trans-loading-content">
      <div className="trans-loading-header">
          <div className="trans-loading-bar trans-loading-title"></div>
          <div className="trans-loading-bar trans-loading-status"></div>
        </div>
        <div className="trans-loading-body">
          <div className="trans-loading-bar trans-loading-metric"></div>
          <div className="trans-loading-bar trans-loading-metric"></div>
          <div className="trans-loading-bar trans-loading-power"></div>
          <div className="trans-loading-bar trans-loading-power"></div>
        </div>
        <div className="trans-loading-footer">
          <div className="trans-loading-bar trans-loading-button"></div>
        </div>
      </div>
    </div>
);

const Transactions = () => {
  const { transactions, currentAccount } = useContext(TransactionContext);
  const [shopItems, setShopItems] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [myPanelsPage, setMyPanelsPage] = useState(1);
  const panelsPerPage = 2;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [listingPrice, setListingPrice] = useState("1");
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);


useEffect(() => {
  const fetchHistory = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const shop = new ethers.Contract(shopContractAddress, Shop.abi, provider);
    const history = await shop.getPurchaseHistory(currentAccount);
    setPurchaseHistory(history);
  };

  if (currentAccount) fetchHistory();
}, [currentAccount]);

   const normalizeValue = (val) => (Math.abs(val) > 1000 ? Math.round(val / 10000) : val);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      if (!window.ethereum || !currentAccount) return;



      try {

        const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // ✅ 正确创建 panel 合约并检查授权状态
    const panelContract = new ethers.Contract(solarPanelsContractAddress, SolarPanels.abi, signer);
    const shopAddressOnChain = await panelContract.shopContract();
    const isValidShop =
    shopAddressOnChain &&
    shopAddressOnChain !== ethers.constants.AddressZero &&
    ethers.utils.getAddress(shopAddressOnChain) === ethers.utils.getAddress(shopContractAddress);

  setIsAuthorized(isValidShop);
    if (
      shopAddressOnChain &&
      ethers.utils.getAddress(shopAddressOnChain) === ethers.utils.getAddress(shopContractAddress)
    ) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
    const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, provider);
    const solarPanelsContract = new ethers.Contract(solarPanelsContractAddress, SolarPanels.abi, signer);

    // ✅ 获取商店商品数据


        // 获取商店商品数据
        const itemCount = await shopContract.itemCount();
        let items = [];
        for (let i = 1; i <= itemCount; i++) {
  const item = await shopContract.getItem(i);
  const pendingBuyers = await shopContract.getPendingBuyers(item.id); // 👈 添加这一行

  if (!item.purchased) {
    items.push({
      id: item.id.toNumber(),
      name: item.name,
      price: ethers.utils.formatEther(item.price),
      owner: item.seller,
      latitude: normalizeValue(item.latitude.toNumber()),
      longitude: normalizeValue(item.longitude.toNumber()),
      batteryTemp: normalizeValue(item.batteryTemperature.toNumber()),
      dcPower: normalizeValue(item.dcPower.toNumber()),
      acPower: normalizeValue(item.acPower.toNumber()),
      createdAt: new Date(item.createdAt.toNumber() * 1000).toLocaleDateString(),
      pendingBuyers: pendingBuyers, // 👈 添加到对象里
    });
  }
}

        setShopItems(items);

        // 获取当前用户的太阳能板
        const myPanelsData = await solarPanelsContract.getMyPanels();
                // 在获取完 shopItems 之后判断每个面板是否已经上架
        const shopPanelIds = new Set(items.map(item => item.id));

        const panels = myPanelsData.map((panel) => {
          const panelId = panel.id.toNumber();
          const isListed = shopPanelIds.has(panelId);

          return {
            id: panelId,
            latitude: normalizeValue(panel.latitude?.toNumber() || 0),
            longitude: normalizeValue(panel.longitude?.toNumber() || 0),
            batteryTemp: normalizeValue(panel.batteryTemperature?.toNumber() || 0),
            dcPower: normalizeValue(panel.dcPower?.toNumber() || 0),
            acPower: normalizeValue(panel.acPower?.toNumber() || 0),
            createdAt: panel.createdAt ? new Date(panel.createdAt.toNumber() * 1000).toLocaleDateString() : "未知",
            owner: currentAccount,
            name: `太阳能面板 #${panelId}`,
            price: isListed ? "已上架" : "未上架",   // 👈 状态判断
            isMine: true,
            rawLatitude: panel.latitude.toNumber(),
            rawLongitude: panel.longitude.toNumber(),
            rawBatteryTemp: panel.batteryTemperature.toNumber(),
            rawDcPower: panel.dcPower.toNumber(),
            rawAcPower: panel.acPower.toNumber(),
            rawCreatedAt: panel.createdAt.toNumber()
          };
        });



        setMyPanels(panels);
        setLoading(false);
      } catch (error) {
        console.error("获取数据失败:", error);
        setLoading(false);
      }
    };

    if (currentAccount) {
      fetchData();
    } else {
      // 如果没有账号，短暂延迟后显示
      setTimeout(() => setLoading(false), 500);
    }
  }, [currentAccount]);
  const handleBuy = async (itemId, price, seller) => {
  if (seller.toLowerCase() === currentAccount.toLowerCase()) {
    alert("❌ 无法购买自己上架的太阳能面板");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, signer);
    const tokenContract = new ethers.Contract(tokenAddress, SolarToken.abi, signer);

    const priceInWei = ethers.utils.parseEther(price.toString());
    const allowance = await tokenContract.allowance(currentAccount, shopContractAddress);

    if (allowance.lt(priceInWei)) {
      const approveTx = await tokenContract.approve(shopContractAddress, priceInWei);
      await approveTx.wait();
    }

    const tx = await shopContract.offerToBuy(itemId);
    await tx.wait();

    alert("✅ 出价成功，等待卖家批准");
    window.location.reload();
  } catch (err) {
    console.error("购买失败", err);
    alert("❌ 购买失败");
  }
};

const cancelListing = async (itemId) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, signer);

    const tx = await shopContract.cancelListing(itemId);
    await tx.wait();

    alert(`✅ 面板 ${itemId} 已下架`);
    window.location.reload();
  } catch (error) {
    console.error("下架失败:", error);
    alert("❌ 下架失败");
  }
};

  const authorizeShopContract = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const panelContract = new ethers.Contract(solarPanelsContractAddress, SolarPanels.abi, signer);
      const tx = await panelContract.setShopContract(shopContractAddress);
      await tx.wait();
      alert("✅ 已授权 Shop 合约");
    } catch (e) {
      console.error("授权失败", e);
      alert("授权失败");
    }
  };
  const approveSale = async (itemId, buyer) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const shop = new ethers.Contract(shopContractAddress, Shop.abi, signer);

    const tx = await shop.approveSale(itemId, buyer);
    await tx.wait();

    alert("✅ 成功批准交易！");
    window.location.reload();
  } catch (e) {
    console.error("批准失败:", e);
    alert("❌ 批准失败");
  }
};


  const listItemOnShop = async () => {
    if (!selectedPanel) return;
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, signer);

      // 将价格转换为Wei单位
      const priceInWei = ethers.utils.parseEther(listingPrice);
      const tx = await shopContract.listItem(
  selectedPanel.name,
  priceInWei,
  selectedPanel.rawLatitude,
  selectedPanel.rawLongitude,
  selectedPanel.rawBatteryTemp,
  selectedPanel.rawDcPower,
  selectedPanel.rawAcPower,
  selectedPanel.rawCreatedAt,
  selectedPanel.id  // 注意：你可能需要添加这个字段（时间戳，单位秒）
);



      // 显示等待状态
      setShowModal(false);
      setSelectedPanel(null);

      // 等待交易完成
      await tx.wait();

      // 更新界面
      setMyPanels((prevPanels) =>
        prevPanels.filter(panel => panel.id !== selectedPanel.id)
      );

      // 成功通知
      alert(`面板 ${selectedPanel.id} 已成功上架，价格为 ${listingPrice} SOLR`);
      window.location.reload();
    } catch (error) {
      console.error("上架失败:", error);
      alert("上架失败，请重试");
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const allTransactions = [...shopItems];
    // ✅ 只显示链上未售出的商品
  const currentTransactions = shopItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(shopItems.length / itemsPerPage);

  const myPanelsTotalPages = Math.ceil(myPanels.length / panelsPerPage);
  const displayedPanels = myPanels.slice(
    (myPanelsPage - 1) * panelsPerPage,
    myPanelsPage * panelsPerPage
  );

  return (
    <div className="trans-marketplace">
      <div className="trans-container">
        <div className="trans-header">
          <h1 className="trans-main-title">
            <span className="trans-title-icon">⚡</span>
            太阳能交易中心
            <span className="trans-title-accent">SOLAR EXCHANGE</span>
          </h1>
        </div>
        {!isAuthorized && (
  <button className="trans-action-button" onClick={authorizeShopContract}>
    🔐 授权 Shop 合约控制面板转移
  </button>
)}

        <div className="trans-layout">
          {/* 我的太阳能板区域 */}

          <div className="trans-sidebar">
            <div className="trans-section-card">
              <div className="trans-section-header">
                <h2 className="trans-section-title">
                  <span className="trans-section-icon">🏠</span>
                  我的能源设备
                </h2>
                <div className="trans-panel-count">{myPanels.length} 台设备</div>
              </div>

              <div className="trans-panels-list">
                {loading ? (
                    <>
                      <LoadingCard/>
                      <LoadingCard/>
                    </>
                ) : myPanels.length > 0 ? (
                    <>
                      {displayedPanels.map((panel) => (
                          <PanelCard
  key={panel.id}
  {...panel}
  onList={() => {
    setSelectedPanel(panel);
    setShowModal(true);
  }}
  onCancel={cancelListing}
/>

                      ))}

                      {/* 分页控件 */}
                      {myPanelsTotalPages > 1 && (
                          <div className="trans-pagination">
                            <button
                                className="trans-pagination-btn trans-prev-btn"
                                disabled={myPanelsPage === 1}
                                onClick={() => setMyPanelsPage(myPanelsPage - 1)}
                            >
                              ← 上一页
                            </button>
                            <div className="trans-pagination-info">
                              <span className="trans-current-page">{myPanelsPage}</span>
                              <span className="trans-page-separator">/</span>
                              <span className="trans-total-pages">{myPanelsTotalPages}</span>
                            </div>
                            <button
                                className="trans-pagination-btn trans-next-btn"
                                disabled={myPanelsPage === myPanelsTotalPages}
                                onClick={() => setMyPanelsPage(myPanelsPage + 1)}
                            >
                              下一页 →
                            </button>
                          </div>
                      )}
                    </>
                ) : (
                    <div className="trans-empty-state">
                      <div className="trans-empty-icon">🔋</div>
                      <p className="trans-empty-text">您还没有太阳能板</p>
                      <p className="trans-empty-subtext">快去获取您的第一台设备吧！</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* 太阳能面板商店区域 */}
          <div className="trans-main-content">
            <div className="trans-section-card">
              <div className="trans-section-header">
                <h2 className="trans-section-title">
                  <span className="trans-section-icon">🛒</span>
                  能源设备商店
                </h2>
                <div className="trans-items-count">{allTransactions.length} 件商品</div>
              </div>

              {loading ? (
                  <div className="trans-shop-grid">
                    <LoadingCard/>
                    <LoadingCard/>
                    <LoadingCard/>
                    <LoadingCard/>
                  </div>
              ) : (
                  <>
                    <div className="trans-shop-grid">
                      {currentTransactions.map((transaction, i) => (
                          <div key={i} className="trans-shop-item">
                            <PanelCard {...transaction} onBuy={(id, price) => handleBuy(id, price, transaction.owner)} />



                            {/* 👇 若当前账户是卖家且有 pendingBuyers，则显示审批列表 */}
                            {transaction.pendingBuyers?.length > 0 && (
                            <div className="trans-approval-card">
                              <h4 className="trans-approval-title">📝 待审批买家</h4>
                              <div className="trans-approval-list">
                                {transaction.pendingBuyers.map((buyer, idx) => (
                                  <div key={idx} className="trans-approval-entry">
                                    <span className="trans-approval-address">{shortenAddress(buyer)}</span>
                                    <button className="trans-approval-button" onClick={() => approveSale(transaction.id, buyer)}>
                                      同意交易
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}


                          </div>
                      ))}
                    </div>

                    {/* 商店分页 */}
                    {totalPages > 1 && (
                        <div className="trans-pagination trans-shop-pagination">
                          <button
                              className="trans-pagination-btn trans-prev-btn"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            ← 上一页
                          </button>
                          <div className="trans-pagination-info">
                            <span className="trans-current-page">{currentPage}</span>
                            <span className="trans-page-separator">/</span>
                            <span className="trans-total-pages">{totalPages}</span>
                          </div>
                          <button
                              className="trans-pagination-btn trans-next-btn"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            下一页 →
                          </button>
                        </div>
                    )}
                  </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 上架确认弹窗 */}
      {showModal && selectedPanel && (
          <div className="trans-modal-overlay">
            <div className="trans-modal">
              <div className="trans-modal-header">
                <h3 className="trans-modal-title">
                  <span className="trans-modal-icon">📈</span>
                  设备上架出售
                </h3>
                <button
                    className="trans-modal-close"
                    onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="trans-modal-body">
                <div className="trans-modal-panel-info">
                  <div className="trans-modal-panel-header">
                    <h4 className="trans-modal-panel-name">{selectedPanel.name}</h4>
                    <div className="trans-modal-panel-id">ID: #{selectedPanel.id}</div>
                  </div>

                <div className="trans-modal-specs">
                  <div className="trans-spec-row">
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">位置</span>
                      <span className="trans-spec-value">{selectedPanel.latitude}°, {selectedPanel.longitude}°</span>
                    </div>
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">温度</span>
                      <span className="trans-spec-value">{selectedPanel.batteryTemp}°C</span>
                    </div>
                  </div>
                  <div className="trans-spec-row">
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">直流功率</span>
                      <span className="trans-spec-value">{selectedPanel.dcPower} W</span>
                    </div>
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">交流功率</span>
                      <span className="trans-spec-value">{selectedPanel.acPower} W</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="trans-price-section">
                <label className="trans-price-label">设置售价</label>
                <div className="trans-price-input-group">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="输入价格"
                    className="trans-price-input"
                  />
                  <span className="trans-price-currency">SOLR</span>
                </div>
              </div>
            </div>

            <div className="trans-modal-actions">
              <button
                className="trans-modal-btn trans-confirm-btn"
                onClick={listItemOnShop}
              >
                <span className="trans-btn-icon">✅</span>
                确认上架
              </button>
              <button
                className="trans-modal-btn trans-cancel-btn"
                onClick={() => setShowModal(false)}
              >
                <span className="trans-btn-icon">❌</span>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};

export default Transactions;