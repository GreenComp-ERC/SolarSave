import React, { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { TransactionContext } from "../context/TransactionContext";
import dummyData from "../utils/dummyData";
import { shortenAddress } from "../utils/shortenAddress";
import SolarToken from "../utils/test/SolarToken.json";
import Shop from "../utils/test/Shop.json";
import SolarPanels from "../utils/test/SolarPanels.json";
import "../style/Transactions.css"; // Import CSS
const tokenAddress = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e";
const shopContractAddress = "0xb997c4257Bc9Ca4e68529A3d649D851562ca8b4c";
const solarPanelsContractAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";

// Solar panel card component
const PanelCard = ({ id, latitude, longitude, batteryTemp, dcPower, acPower, createdAt, owner, price, name, isMine, onList, onBuy, onCancel }) => {

  // Calculate power percentage (assume 1000W max)
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
            <span className="trans-status-text">{isActive ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="trans-performance-section">
          <div className="trans-performance-header">
            <span className="trans-performance-title">Live performance</span>
            <div className="trans-price-badge">{isNaN(price) ? price : `${price} SOLR`}</div>
          </div>

          <div className="trans-metrics-grid">
            <div className="trans-metric-item">
              <div className="trans-metric-label">Coordinates</div>
              <div className="trans-metric-value">{latitude}°, {longitude}°</div>
            </div>

            <div className="trans-metric-item">
              <div className="trans-metric-label">Battery temperature</div>
              <div className="trans-metric-value trans-temp-value">{batteryTemp}°C</div>
            </div>
          </div>

          <div className="trans-power-section">
            <div className="trans-power-item">
              <div className="trans-power-header">
                <span className="trans-power-label">DC Power</span>
                <span className="trans-power-value">{dcPower} W</span>
              </div>
              <div className="trans-power-bar">
                <div className="trans-power-fill trans-dc-fill" style={{width: `${dcPowerPercentage}%`}}></div>
              </div>
            </div>

            <div className="trans-power-item">
              <div className="trans-power-header">
                <span className="trans-power-label">AC Power</span>
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
              <span className="trans-info-label">Created at</span>
              <span className="trans-info-value">{createdAt}</span>
            </div>
            <div className="trans-info-item">
              <span className="trans-info-label">Owner</span>
              <span className="trans-info-value trans-owner-address">{shortenAddress(owner)}</span>
            </div>
          </div>

          {/* Action buttons */}
          {isMine ? (
  <>
    {price === "Not listed" && (
      <button
        onClick={() => onList(id)}
        className="trans-action-button trans-list-button"
      >
        <span className="trans-button-icon">⚡</span>
        List for sale
      </button>
    )}

    {price === "Listed" && (
      <button
        onClick={() => onCancel(id)}
        className="trans-action-button trans-cancel-button"
      >
        <span className="trans-button-icon">❌</span>
        Unlist
      </button>
    )}
  </>
) : (
  <button
    onClick={() => onBuy(id, price)}
    className="trans-action-button trans-list-button"
  >
    <span className="trans-button-icon">💰</span>
    Buy
  </button>
)}

        </div>

      </div>
  );
};

// Loading placeholder component
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

    // ✅ Create panel contract and check authorization
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

    // ✅ Fetch shop items


        // Fetch shop items
        const itemCount = await shopContract.itemCount();
        let items = [];
        for (let i = 1; i <= itemCount; i++) {
  const item = await shopContract.getItem(i);
  const pendingBuyers = await shopContract.getPendingBuyers(item.id); // 👈 Add this line

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
      pendingBuyers: pendingBuyers, // 👈 Add to item object
    });
  }
}

        setShopItems(items);

        // Fetch current user's solar panels
        const myPanelsData = await solarPanelsContract.getMyPanels();
                // Determine if panels are listed after fetching shopItems
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
            createdAt: panel.createdAt ? new Date(panel.createdAt.toNumber() * 1000).toLocaleDateString() : "Unknown",
            owner: currentAccount,
            name: `Solar Panel #${panelId}`,
            price: isListed ? "Listed" : "Not listed",   // 👈 Status
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
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    if (currentAccount) {
      fetchData();
    } else {
      // If no account, show after a short delay
      setTimeout(() => setLoading(false), 500);
    }
  }, [currentAccount]);
  const handleBuy = async (itemId, price, seller) => {
  if (seller.toLowerCase() === currentAccount.toLowerCase()) {
    alert("❌ You cannot buy your own listed solar panel");
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

    alert("✅ Offer submitted, waiting for seller approval");
    window.location.reload();
  } catch (err) {
    console.error("Purchase failed", err);
    alert("❌ Purchase failed");
  }
};

const cancelListing = async (itemId) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, signer);

    const tx = await shopContract.cancelListing(itemId);
    await tx.wait();

    alert(`✅ Panel ${itemId} has been unlisted`);
    window.location.reload();
  } catch (error) {
    console.error("Unlisting failed:", error);
    alert("❌ Unlisting failed");
  }
};

  const authorizeShopContract = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const panelContract = new ethers.Contract(solarPanelsContractAddress, SolarPanels.abi, signer);
      const tx = await panelContract.setShopContract(shopContractAddress);
      await tx.wait();
      alert("✅ Shop contract authorized");
    } catch (e) {
      console.error("Authorization failed", e);
      alert("Authorization failed");
    }
  };
  const approveSale = async (itemId, buyer) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const shop = new ethers.Contract(shopContractAddress, Shop.abi, signer);

    const tx = await shop.approveSale(itemId, buyer);
    await tx.wait();

    alert("✅ Sale approved successfully!");
    window.location.reload();
  } catch (e) {
    console.error("Approval failed:", e);
    alert("❌ Approval failed");
  }
};


  const listItemOnShop = async () => {
    if (!selectedPanel) return;
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const shopContract = new ethers.Contract(shopContractAddress, Shop.abi, signer);

      // Convert price to Wei
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
  selectedPanel.id  // Note: you may need to add this field (timestamp in seconds)
);



      // Show waiting state
      setShowModal(false);
      setSelectedPanel(null);

      // Wait for transaction completion
      await tx.wait();

      // Update UI
      setMyPanels((prevPanels) =>
        prevPanels.filter(panel => panel.id !== selectedPanel.id)
      );

      // Success notification
      alert(`Panel ${selectedPanel.id} listed successfully for ${listingPrice} SOLR`);
      window.location.reload();
    } catch (error) {
      console.error("Listing failed:", error);
      alert("Listing failed, please try again");
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const allTransactions = [...shopItems];
    // ✅ Only show unsold on-chain items
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
            Solar Energy Exchange
            <span className="trans-title-accent">SOLAR EXCHANGE</span>
          </h1>
        </div>
        {!isAuthorized && (
  <button className="trans-action-button" onClick={authorizeShopContract}>
    🔐 Authorize Shop contract to control panel transfers
  </button>
)}

        <div className="trans-layout">
          {/* My solar panels */}

          <div className="trans-sidebar">
            <div className="trans-section-card">
              <div className="trans-section-header">
                <h2 className="trans-section-title">
                  <span className="trans-section-icon">🏠</span>
                  My Energy Devices
                </h2>
                <div className="trans-panel-count">{myPanels.length} devices</div>
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

                      {/* Pagination controls */}
                      {myPanelsTotalPages > 1 && (
                          <div className="trans-pagination">
                            <button
                                className="trans-pagination-btn trans-prev-btn"
                                disabled={myPanelsPage === 1}
                                onClick={() => setMyPanelsPage(myPanelsPage - 1)}
                            >
                              ← Previous
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
                              Next →
                            </button>
                          </div>
                      )}
                    </>
                ) : (
                    <div className="trans-empty-state">
                      <div className="trans-empty-icon">🔋</div>
                      <p className="trans-empty-text">You don't have any solar panels yet</p>
                      <p className="trans-empty-subtext">Get your first device now!</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Solar panel store */}
          <div className="trans-main-content">
            <div className="trans-section-card">
              <div className="trans-section-header">
                <h2 className="trans-section-title">
                  <span className="trans-section-icon">🛒</span>
                  Energy Device Store
                </h2>
                <div className="trans-items-count">{allTransactions.length} items</div>
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



                            {/* 👇 If current account is the seller and has pending buyers, show approvals */}
                            {transaction.pendingBuyers?.length > 0 && (
                            <div className="trans-approval-card">
                              <h4 className="trans-approval-title">📝 Pending buyers</h4>
                              <div className="trans-approval-list">
                                {transaction.pendingBuyers.map((buyer, idx) => (
                                  <div key={idx} className="trans-approval-entry">
                                    <span className="trans-approval-address">{shortenAddress(buyer)}</span>
                                    <button className="trans-approval-button" onClick={() => approveSale(transaction.id, buyer)}>
                                      Approve sale
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}


                          </div>
                      ))}
                    </div>

                    {/* Store pagination */}
                    {totalPages > 1 && (
                        <div className="trans-pagination trans-shop-pagination">
                          <button
                              className="trans-pagination-btn trans-prev-btn"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            ← Previous
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
                            Next →
                          </button>
                        </div>
                    )}
                  </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listing confirmation modal */}
      {showModal && selectedPanel && (
          <div className="trans-modal-overlay">
            <div className="trans-modal">
              <div className="trans-modal-header">
                <h3 className="trans-modal-title">
                  <span className="trans-modal-icon">📈</span>
                  List device for sale
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
                      <span className="trans-spec-label">Location</span>
                      <span className="trans-spec-value">{selectedPanel.latitude}°, {selectedPanel.longitude}°</span>
                    </div>
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">Temperature</span>
                      <span className="trans-spec-value">{selectedPanel.batteryTemp}°C</span>
                    </div>
                  </div>
                  <div className="trans-spec-row">
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">DC Power</span>
                      <span className="trans-spec-value">{selectedPanel.dcPower} W</span>
                    </div>
                    <div className="trans-spec-item">
                      <span className="trans-spec-label">AC Power</span>
                      <span className="trans-spec-value">{selectedPanel.acPower} W</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="trans-price-section">
                <label className="trans-price-label">Set price</label>
                <div className="trans-price-input-group">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Enter price"
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
                Confirm listing
              </button>
              <button
                className="trans-modal-btn trans-cancel-btn"
                onClick={() => setShowModal(false)}
              >
                <span className="trans-btn-icon">❌</span>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};

export default Transactions;