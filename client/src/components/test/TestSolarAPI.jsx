import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import SolarPanels from "../../utils/test/SolarPanels.json";
import "../../style/TestPanels.css";

const contractAddress = "0x000b697FD091585bBA0C1e3f92c8Ba4A3Cc15B3d"; // Your SolarPanels contract address

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
            alert("Please install MetaMask!");
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
        if (!contract) return alert("Contract not connected");

        try {
            const tx = await contract.createPanel(
                newPanel.lat,
                newPanel.lng,
                newPanel.batteryTemp,
                newPanel.dcPower,
                newPanel.acPower
            );
            await tx.wait();
            alert("🌞 Solar panel created!");
            fetchPanels(contract);
            fetchMyPanels(contract);
        } catch (error) {
            console.error("Creation failed:", error);
            alert("❌ Solar panel creation failed!");
        }
    };

    const fetchPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;
        try {
            const allPanels = await contractInstance.getAllPanels();
            setPanels(allPanels);
        } catch (error) {
            console.error("❌ Failed to fetch all solar panels:", error);
        }
    };

    const fetchMyPanels = async (contractInstance = contract) => {
        if (!contractInstance) return;
        try {
            const myPanelsData = await contractInstance.getMyPanels();
            setMyPanels(myPanelsData);
        } catch (error) {
            console.error("❌ Failed to fetch user solar panels:", error);
        }
    };

    const updatePanel = async (id, batteryTemp, dcPower, acPower) => {
        if (!contract) return alert("Contract not connected");

        try {
            const tx = await contract.updatePanel(id, batteryTemp, dcPower, acPower);
            await tx.wait();
            alert("✅ Panel updated!");
            fetchPanels();
            fetchMyPanels();
        } catch (error) {
            console.error("❌ Panel update failed:", error);
            alert("Update failed!");
        }
    };

    const transferPanel = async () => {
        if (!contract) return alert("Contract not connected");

        try {
            const tx = await contract.transferPanelOwnership(transfer.panelId, transfer.newOwner);
            await tx.wait();
            alert("✅ Panel transfer successful!");
            fetchPanels();
            fetchMyPanels();
        } catch (error) {
            console.error("❌ Panel transfer failed:", error);
            alert("Transfer failed!");
        }
    };

    return (
        <div className="panel-container">
            <h2>🌞 SolarPanels Test DApp</h2>
            <p className="account-text">🟢 Current account: {account}</p>

            {/* Create */}
            <div className="panel-card">
                <h3>Create solar panel</h3>
                <input type="number" style={{ color: "black" }} placeholder="Latitude" onChange={(e) => setNewPanel({ ...newPanel, lat: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="Longitude" onChange={(e) => setNewPanel({ ...newPanel, lng: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="Battery temperature (°C)" value={newPanel.batteryTemp} onChange={(e) => setNewPanel({ ...newPanel, batteryTemp: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="DC power (W)" value={newPanel.dcPower} onChange={(e) => setNewPanel({ ...newPanel, dcPower: e.target.value })} />
                <input type="number" style={{ color: "black" }} placeholder="AC power (W)" value={newPanel.acPower} onChange={(e) => setNewPanel({ ...newPanel, acPower: e.target.value })} />
                <button className="button" onClick={createPanel}>Create solar panel</button>
            </div>

            {/* All panels */}
            <div className="panel-card">
                <h3>All solar panels</h3>
                <button className="button refresh-button" onClick={fetchPanels}>Refresh</button>
                <div className="panel-list">
                    {panels.length === 0 ? <p>No data</p> : panels.map((panel, index) => (
                        <div key={index} className="panel-item">
                            <p>📌 ID: {panel.id.toString()}</p>
                            <p>📍 Coordinates: ({panel.latitude.toString()}, {panel.longitude.toString()})</p>
                            <p>🔥 Temperature: {panel.batteryTemperature.toString()}°C</p>
                            <p>⚡ DC Power: {panel.dcPower.toString()}W</p>
                            <p>🔌 AC Power: {panel.acPower.toString()}W</p>
                            <p>👤 Owner: {panel.owner.toString()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* My panels */}
            <div className="panel-card">
                <h3>My solar panels</h3>
                <button className="button refresh-button" onClick={fetchMyPanels}>Refresh</button>
                <div className="panel-list">
                    {myPanels.length === 0 ? <p>No data</p> : myPanels.map((panel, index) => (
                        <div key={index} className="panel-item">
                            <p>📌 ID: {panel.id.toString()}</p>
                            <p>📍 Coordinates: ({panel.latitude.toString()}, {panel.longitude.toString()})</p>
                            <p>🔥 Temperature: {panel.batteryTemperature.toString()}°C</p>
                            <p>⚡ DC Power: {panel.dcPower.toString()}W</p>
                            <p>🔌 AC Power: {panel.acPower.toString()}W</p>
                            <p>👤 Owner: {panel.owner.toString()}</p>

                            <input type="number" style={{ color: "black" }} placeholder="New temperature" onChange={(e) => setNewPanel({ ...newPanel, batteryTemp: e.target.value })} />
                            <input type="number" style={{ color: "black" }} placeholder="New DC power" onChange={(e) => setNewPanel({ ...newPanel, dcPower: e.target.value })} />
                            <input type="number" style={{ color: "black" }} placeholder="New AC power" onChange={(e) => setNewPanel({ ...newPanel, acPower: e.target.value })} />
                            <button className="button update-button" onClick={() => updatePanel(panel.id.toString(), newPanel.batteryTemp, newPanel.dcPower, newPanel.acPower)}>Update</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel ownership transfer */}
            <div className="panel-card">
                <h3>Transfer panel ownership</h3>
                <input type="number" placeholder="Panel ID" style={{ color: "black" }} onChange={(e) => setTransfer({ ...transfer, panelId: e.target.value })} />
                <input type="text" placeholder="New owner address" style={{ color: "black" }} onChange={(e) => setTransfer({ ...transfer, newOwner: e.target.value })} />
                <button className="button transfer-button" onClick={transferPanel}>Transfer ownership</button>
            </div>
        </div>
    );
};

export default TestPanels;
