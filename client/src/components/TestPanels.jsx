import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import SolarPanels from "../utils/SolarPanels.json"; // ✅ 太阳能板合约 ABI
import "../style/TestPanels.css"; // ✅ 样式文件

const contractAddress = "0x9C29EE061119e730a1ba4EcdB71Bb00C01BF5aE9"; // ⚠️ 替换为你的 `SolarPanels` 合约地址

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

    useEffect(() => {
        connectWallet();
    }, []);

    // 🔗 连接钱包 & 合约
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

    // **🆕 创建太阳能板**
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

    // **📡 查询所有太阳能板**
    const fetchPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;

        try {
            const allPanels = await contractInstance.getAllPanels();
            setPanels(allPanels);
        } catch (error) {
            console.error("❌ 获取所有太阳能板失败:", error);
        }
    };

    // **👤 查询用户自己的太阳能板**
    const fetchMyPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;

        try {
            const myPanelsData = await contractInstance.getMyPanels();
            setMyPanels(myPanelsData);
        } catch (error) {
            console.error("❌ 获取用户太阳能板失败:", error);
        }
    };

    // **🔄 更新太阳能板**
    const updatePanel = async (id, newBatteryTemp, newDcPower, newAcPower) => {
        if (!contract) return alert("未连接合约");

        try {
            const tx = await contract.updatePanel(id, newBatteryTemp, newDcPower, newAcPower);
            await tx.wait();
            alert("✅ 太阳能板更新成功!");
            fetchPanels();
            fetchMyPanels();
        } catch (error) {
            console.error("❌ 更新失败:", error);
            alert("❌ 太阳能板更新失败！");
        }
    };

    return (
        <div className="panel-container">
            <h2>🌞 SolarPanels 测试 DApp</h2>
            <p className="account-text">🟢 连接的账户: {account}</p>

            {/* **创建太阳能板** */}
            <div className="panel-card">
                <h3>创建太阳能板</h3>
                <input type="number" placeholder="纬度" onChange={(e) => setNewPanel({ ...newPanel, lat: e.target.value })} />
                <input type="number" placeholder="经度" onChange={(e) => setNewPanel({ ...newPanel, lng: e.target.value })} />
                <input type="number" placeholder="电池温度 (°C)" value={newPanel.batteryTemp} onChange={(e) => setNewPanel({ ...newPanel, batteryTemp: e.target.value })} />
                <input type="number" placeholder="直流功率 (W)" value={newPanel.dcPower} onChange={(e) => setNewPanel({ ...newPanel, dcPower: e.target.value })} />
                <input type="number" placeholder="交流功率 (W)" value={newPanel.acPower} onChange={(e) => setNewPanel({ ...newPanel, acPower: e.target.value })} />
                <button className="button" onClick={createPanel}>创建太阳能板</button>
            </div>

            {/* **查询所有太阳能板** */}
            <div className="panel-card">
                <h3>所有太阳能板</h3>
                <button className="button refresh-button" onClick={fetchPanels}>刷新列表</button>
                <div className="panel-list">
                    {panels.length === 0 ? <p>暂无数据</p> : panels.map((panel, index) => (
                        <div key={index} className="panel-item">
                            <p>📌 ID: {panel.id.toString()}</p>
                            <p>📍 位置: ({panel.latitude.toString()}, {panel.longitude.toString()})</p>
                            <p>🔥 电池温度: {panel.batteryTemperature.toString()}°C</p>
                            <p>⚡ 直流功率: {panel.dcPower.toString()} W</p>
                            <p>🔌 交流功率: {panel.acPower.toString()} W</p>
                            <p>🛠 所有者: {panel.owner}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* **查询用户的太阳能板** */}
            <div className="panel-card">
                <h3>我的太阳能板</h3>
                <button className="button refresh-button" onClick={fetchMyPanels}>刷新列表</button>
                <div className="panel-list">
                    {myPanels.length === 0 ? <p>暂无数据</p> : myPanels.map((panel, index) => (
                        <div key={index} className="panel-item">
                            <p>📌 ID: {panel.id.toString()}</p>
                            <p>📍 位置: ({panel.latitude.toString()}, {panel.longitude.toString()})</p>
                            <p>🔥 电池温度: {panel.batteryTemperature.toString()}°C</p>
                            <p>⚡ 直流功率: {panel.dcPower.toString()} W</p>
                            <p>🔌 交流功率: {panel.acPower.toString()} W</p>
                            <p>🛠 所有者: {panel.owner}</p>
                            <input type="number" placeholder="新温度" onChange={(e) => setNewPanel({ ...newPanel, batteryTemp: e.target.value })} />
                            <input type="number" placeholder="新直流功率" onChange={(e) => setNewPanel({ ...newPanel, dcPower: e.target.value })} />
                            <input type="number" placeholder="新交流功率" onChange={(e) => setNewPanel({ ...newPanel, acPower: e.target.value })} />
                            <button className="button update-button" onClick={() => updatePanel(panel.id.toString(), newPanel.batteryTemp, newPanel.dcPower, newPanel.acPower)}>更新</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestPanels;
