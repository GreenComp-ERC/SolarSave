import React, { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { TransactionContext } from "../context/TransactionContext";
import dummyData from "../utils/dummyData";
import { shortenAddress } from "../utils/shortenAddress";
import Shop from "../utils/Shop.json";
import SolarPanels from "../utils/SolarPanels.json";
import "../style/Transactions.css"; // 引入CSS文件

const shopContractAddress = "0x1Db966576e4e8e241001Da050FFd80CCabAA8B99";
const solarPanelsContractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9";

// 太阳能面板卡片组件
const PanelCard = ({ id, latitude, longitude, batteryTemp, dcPower, acPower, createdAt, owner, price, name, isMine, onList }) => {
  // 计算电量百分比（假设最大1000W）
  const dcPowerPercentage = Math.min(100, (dcPower / 1000) * 100);
  const acPowerPercentage = Math.min(100, (acPower / 1000) * 100);
  const isActive = dcPower > 100; // 简单判断是否活跃

  return (
    <div className="solar-card p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-blue-400">{name}</h3>

        <div className="flex items-center">
          <span className={`solar-status ${isActive ? 'solar-status-active' : 'solar-status-inactive'}`}></span>
          <span className="text-xs text-gray-300">{isActive ? '活跃' : '非活跃'}</span>
        </div>
      </div>

      <div className="bg-gray-800 bg-opacity-40 rounded p-3 mb-3">
        <div className="solar-data-item">
          <span className="solar-data-label">价格</span>
          <span className="solar-data-value text-green-400 font-bold">{price} SOLR</span>
        </div>

        <div className="solar-data-item">
          <span className="solar-data-label">纬度</span>
          <span className="solar-data-value">{latitude}°</span>
        </div>

        <div className="solar-data-item">
          <span className="solar-data-label">经度</span>
          <span className="solar-data-value">{longitude}°</span>
        </div>

        <div className="solar-data-item">
          <span className="solar-data-label">电池温度</span>
          <span className="solar-data-value">{batteryTemp}°C</span>
        </div>

        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">直流功率</span>
            <span className="text-xs text-gray-300">{dcPower} W</span>
          </div>
          <div className="solar-power-bar">
            <div className="solar-power-fill" style={{ width: `${dcPowerPercentage}%` }}></div>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">交流功率</span>
            <span className="text-xs text-gray-300">{acPower} W</span>
          </div>
          <div className="solar-power-bar">
            <div className="solar-power-fill solar-power-fill-ac" style={{ width: `${acPowerPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        <div className="solar-data-item">
          <span>创建时间</span>
          <span>{createdAt}</span>
        </div>
        <div className="solar-data-item">
          <span>所有者</span>
          <span className="text-blue-300">{shortenAddress(owner)}</span>
        </div>
      </div>

      {isMine && (
        <button
          onClick={() => onList(id)}
          className="solar-button"
        >
          上架出售
        </button>
      )}
    </div>
  );
};

// 加载占位组件
const LoadingCard = () => (
  <div className="solar-card p-4">
    <div className="animate-pulse">
      <div className="h-5 bg-gray-700 rounded mb-4"></div>
      <div className="h-4 bg-gray-700 rounded mb-3 w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-3"></div>
      <div className="h-4 bg-gray-700 rounded mb-3"></div>
      <div className="h-4 bg-gray-700 rounded mb-3"></div>
      <div className="h-4 bg-gray-700 rounded mb-3"></div>
      <div className="h-10 bg-gray-700 rounded mt-4"></div>
    </div>
  </div>
);

const Transactions = () => {
  const { transactions, currentAccount } = useContext(TransactionContext);
  const [shopItems, setShopItems] = useState([]);
  const [myPanels, setMyPanels] = useState([]);
  const [myPanelsPage, setMyPanelsPage] = useState(1);
  const panelsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [listingPrice, setListingPrice] = useState("1");
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      if (!window.ethereum || !currentAccount) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, provider);
        const solarPanelsContract = new ethers.Contract(solarPanelsContractAddress, SolarPanels.abi, signer);

        // 获取商店商品数据
        const itemCount = await shopContract.itemCount();
        let items = [];
        for (let i = 1; i <= itemCount; i++) {
          const item = await shopContract.getItem(i);
          if (!item.purchased) {
            items.push({
              id: item.id.toNumber(),
              name: item.name,
              price: ethers.utils.formatEther(item.price),
              owner: item.seller,
              // 添加一些随机数据用于可视化
              latitude: 30 + Math.random() * 10,
              longitude: 104 + Math.random() * 10,
              batteryTemp: Math.floor(20 + Math.random() * 30),
              dcPower: Math.floor(200 + Math.random() * 600),
              acPower: Math.floor(180 + Math.random() * 550),
              createdAt: new Date().toLocaleDateString()
            });
          }
        }
        setShopItems(items);

        // 获取当前用户的太阳能板
        const myPanelsData = await solarPanelsContract.getMyPanels();
        const panels = myPanelsData.map((panel) => ({
          id: panel.id.toNumber(),
          latitude: panel.latitude?.toNumber() || 0,
          longitude: panel.longitude?.toNumber() || 0,
          batteryTemp: panel.batteryTemperature?.toNumber() || 0,
          dcPower: panel.dcPower?.toNumber() || 0,
          acPower: panel.acPower?.toNumber() || 0,
          createdAt: panel.createdAt ? new Date(panel.createdAt.toNumber() * 1000).toLocaleDateString() : "未知",
          owner: currentAccount,
          name: `太阳能面板 #${panel.id.toNumber()}`,
          price: "未上架",
          isMine: true,
        }));

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

  const listItemOnShop = async () => {
    if (!selectedPanel) return;
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, signer);

      // 将价格转换为Wei单位
      const priceInWei = ethers.utils.parseEther(listingPrice);
      const tx = await shopContract.listItem(selectedPanel.name, priceInWei);

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

  const allTransactions = [...dummyData, ...transactions, ...shopItems];
  const currentTransactions = allTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const myPanelsTotalPages = Math.ceil(myPanels.length / panelsPerPage);
  const displayedPanels = myPanels.slice(
    (myPanelsPage - 1) * panelsPerPage,
    myPanelsPage * panelsPerPage
  );

  return (
    <div className="solar-transactions">
      <div className="container-solar">
        <h2 className="solar-title">太阳能交易市场</h2>

        <div className="solar-layout">
          {/* 我的太阳能板区域 */}
          <div className="solar-layout-left">
            <div className="solar-card p-4">
              <h3 className="solar-subtitle">我的太阳能板</h3>

              {loading ? (
                <div>
                  <LoadingCard />
                  <LoadingCard />
                </div>
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
                    />
                  ))}

                  {/* 分页控件 */}
                  {myPanelsTotalPages > 1 && (
                    <div className="solar-pagination">
                      <button
                        className="solar-pagination-button"
                        disabled={myPanelsPage === 1}
                        onClick={() => setMyPanelsPage(myPanelsPage - 1)}
                      >
                        上一页
                      </button>
                      <span className="solar-pagination-info">
                        {myPanelsPage} / {myPanelsTotalPages}
                      </span>
                      <button
                        className="solar-pagination-button"
                        disabled={myPanelsPage === myPanelsTotalPages}
                        onClick={() => setMyPanelsPage(myPanelsPage + 1)}
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">您还没有太阳能板</p>
                </div>
              )}
            </div>
          </div>

          {/* 太阳能面板商店区域 */}
          <div className="solar-layout-right">
            <div className="solar-card p-4">
              <h3 className="solar-subtitle">太阳能面板商店</h3>

              {loading ? (
                <div className="solar-grid">
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </div>
              ) : (
                <>
                  <div className="solar-grid">
                    {currentTransactions.map((transaction, i) => (
                      <PanelCard key={i} {...transaction} />
                    ))}
                  </div>

                  {/* 商店分页 */}
                  {totalPages > 1 && (
                    <div className="solar-pagination">
                      <button
                        className="solar-pagination-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        上一页
                      </button>
                      <span className="solar-pagination-info">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        className="solar-pagination-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        下一页
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
        <div className="solar-modal-overlay">
          <div className="solar-modal">
            <h3 className="solar-modal-title">上架太阳能面板</h3>

            <div className="bg-gray-800 bg-opacity-40 p-3 rounded mb-4">
              <div className="solar-data-item">
                <span className="solar-data-label">面板ID</span>
                <span className="solar-data-value">#{selectedPanel.id}</span>
              </div>
              <div className="solar-data-item">
                <span className="solar-data-label">纬度</span>
                <span className="solar-data-value">{selectedPanel.latitude}°</span>
              </div>
              <div className="solar-data-item">
                <span className="solar-data-label">经度</span>
                <span className="solar-data-value">{selectedPanel.longitude}°</span>
              </div>
              <div className="solar-data-item">
                <span className="solar-data-label">电池温度</span>
                <span className="solar-data-value">{selectedPanel.batteryTemp}°C</span>
              </div>
              <div className="solar-data-item">
                <span className="solar-data-label">直流功率</span>
                <span className="solar-data-value">{selectedPanel.dcPower} W</span>
              </div>
              <div className="solar-data-item">
                <span className="solar-data-label">交流功率</span>
                <span className="solar-data-value">{selectedPanel.acPower} W</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 mb-2">设置价格 (SOLR)</label>
              <div className="solar-price-input">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="输入价格"
                />
                <span>SOLR</span>
              </div>
            </div>

            <div className="solar-modal-buttons">
              <button className="solar-button" onClick={listItemOnShop}>
                确认上架
              </button>
              <button className="solar-button solar-button-red" onClick={() => setShowModal(false)}>
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