import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import SolarPanels from "../../utils/test/SolarPanels.json";
import "../../style/TestPanels.css";

const contractAddress = "0x000b697FD091585bBA0C1e3f92c8Ba4A3Cc15B3d"; // 你的 SolarPanels 合约地址

const TestPanels = () => {
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState("");
    const [panels, setPanels] = useState([]);
    const [myPanels, setMyPanels] = useState([]);
    const [newPanel, setNewPanel] = useState({
        lat: "",
        lng: "",
        batteryTemp: 30,
        dcPower: 1000,
        acPower: 900,
    });

    const [transfer, setTransfer] = useState({
        panelId: "",
        newOwner: ""
    });

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
        const contractInstance = new ethers.Contract(contractAddress, SolarPanels.abi, signer);

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        setContract(contractInstance);

        fetchPanels(contractInstance);
        fetchMyPanels(contractInstance);
    };

    const createPanel = async () => {
        if (!contract) return alert("未连接合约");

        try {
            const tx = await contract.createPanel(
                newPanel.lat,
                newPanel.lng,
                newPanel.batteryTemp,
                newPanel.dcPower,
                newPanel.acPower
            );
            await tx.wait();
            alert("🌞 太阳能板创建成功!");
            fetchPanels(contract);
            fetchMyPanels(contract);
        } catch (error) {
            console.error("创建失败:", error);
            alert("❌ 太阳能板创建失败！");
        }
    };

    const fetchPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;
        try {
            const allPanels = await contractInstance.getAllPanels();
            setPanels(allPanels);
        } catch (error) {
            console.error("❌ 获取所有太阳能板失败:", error);
        }
    };

    const fetchMyPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;
        try {
            const myPanelsData = await contractInstance.getMyPanels();
            setMyPanels(myPanelsData);
        } catch (error) {
            console.error("❌ 获取用户太阳能板失败:", error);
        }
    };

    const updatePanel = async (id, batteryTemp, dcPower, acPower) => {
        if (!contract) return alert("未连接合约");

        try {
            const tx = await contract.updatePanel(id, batteryTemp, dcPower, acPower);
            await tx.wait();
            alert("✅ 面板更新成功!");
            fetchPanels();
            fetchMyPanels();
        } catch (error) {
            console.error("❌ 面板更新失败:", error);
            alert("更新失败！");
        }
    };

    const transferPanel = async () => {
        if (!contract) return alert("未连接合约");

        try {
            const tx = await contract.transferPanelOwnership(transfer.panelId, transfer.newOwner);
            await tx.wait();
            alert("✅ 面板转让成功!");
            fetchPanels();
            fetchMyPanels();
        } catch (error) {
            console.error("❌ 面板转让失败:", error);
            alert("转让失败！");
        }
    };

    return (
        <div className="panel-container">
            <h2>🌞 SolarPanels 测试 DApp</h2>
            <p className="account-text">🟢 当前账户: {account}</p>

            {/* 创建 */}
            <div className="panel-card">
                <h3>创建太阳能板</h3>
                <input type="number" style={{ color: "black" }} placeholder="纬度" onChange={(e) => setNewPanel({ ...newPanel, lat: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="经度" onChange={(e) => setNewPanel({ ...newPanel, lng: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="电池温度 (°C)" value={newPanel.batteryTemp} onChange={(e) => setNewPanel({ ...newPanel, batteryTemp: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="直流功率 (W)" value={newPanel.dcPower} onChange={(e) => setNewPanel({ ...newPanel, dcPower: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="交流功率 (W)" value={newPanel.acPower} onChange={(e) => setNewPanel({ ...newPanel, acPower: e.target.value })} />
                <button className="button" onClick={createPanel}>创建太阳能板</button>
            </div>

            {/* 所有面板 */}
            <div className="panel-card">
                <h3>所有太阳能板</h3>
                <button className="button refresh-button" onClick={fetchPanels}>刷新</button>
                <div className="panel-list">
                    {panels.length === 0 ? <p>暂无数据</p> : panels.map((panel, index) => (
                        <div key={index} className="panel-item">
                            <p>📌 ID: {panel.id.toString()}</p>
                            <p>📍 坐标: ({panel.latitude.toString()}, {panel.longitude.toString()})</p>
                            <p>🔥 温度: {panel.batteryTemperature.toString()}°C</p>
                            <p>⚡ DC 功率: {panel.dcPower.toString()}W</p>
                            <p>🔌 AC 功率: {panel.acPower.toString()}W</p>
                            <p>👤 所有者: {panel.owner.toString()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 我的面板 */}
            <div className="panel-card">
                <h3>我的太阳能板</h3>
                <button className="button refresh-button" onClick={fetchMyPanels}>刷新</button>
                <div className="panel-list">
                    {myPanels.length === 0 ? <p>暂无数据</p> : myPanels.map((panel, index) => (
                        <div key={index} className="panel-item">
                            <p>📌 ID: {panel.id.toString()}</p>
                            <p>📍 坐标: ({panel.latitude.toString()}, {panel.longitude.toString()})</p>
                            <p>🔥 温度: {panel.batteryTemperature.toString()}°C</p>
                            <p>⚡ DC 功率: {panel.dcPower.toString()}W</p>
                            <p>🔌 AC 功率: {panel.acPower.toString()}W</p>
                            <p>👤 所有者: {panel.owner.toString()}</p>

                            <input type="number" style={{ color: "black" }} placeholder="新温度" onChange={(e) => setNewPanel({ ...newPanel, batteryTemp: e.target.value })} />
                            <input type="number" style={{ color: "black" }} placeholder="新直流功率" onChange={(e) => setNewPanel({ ...newPanel, dcPower: e.target.value })} />
                            <input type="number" style={{ color: "black" }} placeholder="新交流功率" onChange={(e) => setNewPanel({ ...newPanel, acPower: e.target.value })} />
                            <button className="button update-button" onClick={() => updatePanel(panel.id.toString(), newPanel.batteryTemp, newPanel.dcPower, newPanel.acPower)}>更新</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 面板所有权转让 */}
            <div className="panel-card">
                <h3>转让面板所有权</h3>
                <input type="number" placeholder="面板 ID" style={{ color: "black" }} onChange={(e) => setTransfer({ ...transfer, panelId: e.target.value })} />
                <input type="text" placeholder="新所有者地址" style={{ color: "black" }} onChange={(e) => setTransfer({ ...transfer, newOwner: e.target.value })} />
                <button className="button transfer-button" onClick={transferPanel}>转让所有权</button>
            </div>
        </div>
    );
};

export default TestPanels;
