import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import SolarPanelsABI from "../../utils/test/SolarPanels.json";
import PowerRewardABI from "../../utils/test/PowerReward.json";
import "../../style/TestPanels.css";
import ERC20ABI from "../../utils/test/SolarToken.json"; // ✅ SOLR ABI
import contractAddresses from "../../utils/contractAddress.json";
const rewardTokenAddress = contractAddresses.token; // ✅ Replace with your deployed SOLR contract
const solarPanelAddress = contractAddresses.solarPanels; // Replace with your contract address
const powerRewardAddress = contractAddresses.powerReward; // Replace with your contract address

const TestReward = () => {
    const [account, setAccount] = useState("");
    const [panels, setPanels] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [contract, setContract] = useState(null);
    const [rewardContract, setRewardContract] = useState(null);
    const [rewardPreview, setRewardPreview] = useState(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [lastClaimedAt, setLastClaimedAt] = useState(null);
    const [cooldownRemaining, setCooldownRemaining] = useState(null);
    const [poolBalance, setPoolBalance] = useState(null);
    const [simulatorStepSeconds, setSimulatorStepSeconds] = useState(null);
    useEffect(() => {
        connect();
    }, []);
    useEffect(() => {
    const interval = setInterval(() => {
        if (lastClaimedAt !== null && simulatorStepSeconds) {
            const now = Math.floor(Date.now() / 1000);
            const nextClaim = lastClaimedAt + simulatorStepSeconds;
            const remaining = nextClaim - now;
            setCooldownRemaining(remaining > 0 ? remaining : 0);
        }
    }, 1000);

    return () => clearInterval(interval);
}, [lastClaimedAt, simulatorStepSeconds]);


    const connect = async () => {
    if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
    }

    // ✅ 1. Initialize provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    setAccount(userAddress);
    console.log("Current account address:", userAddress); // ✅ For debugging

    // ✅ 2. Initialize contract instances
    const panelContract = new ethers.Contract(solarPanelAddress, SolarPanelsABI.abi, signer);
    const rewardCtr = new ethers.Contract(powerRewardAddress, PowerRewardABI.abi, signer);
    const token = new ethers.Contract(rewardTokenAddress, ERC20ABI.abi, signer);

    // ✅ 3. Update contract state
    setContract(panelContract);
    setRewardContract(rewardCtr);

    const rawBalance = await token.balanceOf(powerRewardAddress);
    setPoolBalance(rawBalance);

    const myPanels = await panelContract.getMyPanels();
    setPanels(myPanels);

    const owner = await rewardCtr.owner();
    setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());

    const preview = await rewardCtr.previewReward(userAddress);
    setRewardPreview(preview);

    const stepSeconds = await rewardCtr.simulatorStepSeconds();
    setSimulatorStepSeconds(stepSeconds.toNumber());

    const last = await rewardCtr.lastClaimedAt(userAddress);
    setLastClaimedAt(last.toNumber());
};




    const claimReward = async () => {
        try {
            const tx = await rewardContract.claimReward();
            await tx.wait();
            alert("✅ Reward claimed successfully!");
            connect();
        } catch (e) {
            console.error("❌ Claim failed", e);
            alert("❌ Reward claim failed!");
        }
    };

    const deposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
        alert("Please enter a valid deposit amount!");
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Initialize SOLR contract instance
        const token = new ethers.Contract(rewardTokenAddress, ERC20ABI.abi, signer);
        const parsedAmount = ethers.utils.parseUnits(depositAmount, 18);

        // 1️⃣ Approve SOLR for the PowerReward contract
        const approveTx = await token.approve(powerRewardAddress, parsedAmount);
        await approveTx.wait();
        console.log("✅ Approval successful");

        // 2️⃣ Execute deposit
        const depositTx = await rewardContract.deposit(parsedAmount);
        await depositTx.wait();
        alert("✅ Deposit successful!");
    } catch (e) {
        console.error("❌ Deposit failed:", e);
        alert("❌ Deposit failed, check approval or network!");
    }
};


    return (
        <div className="panel-container">
            <h2>💰 PowerReward Rewards Center</h2>
            <p className="account-text">Current address: {account}</p>

            {/* Panels */}
            <div className="panel-card">
                <h3>My solar panels</h3>
                {panels.length === 0 ? <p>No panels</p> : panels.map((p, i) => (
                    <div className="panel-item" key={i}>
                        <p>📌 ID: {p.id.toString()}</p>
                        <p>📍 Location: ({p.latitude.toString()}, {p.longitude.toString()})</p>
                        <p>🔥 Temperature: {p.batteryTemperature.toString()}°C</p>
                        <p>⚡ DC Power: {p.dcPower.toString()}W</p>
                        <p>🔌 AC Power: {p.acPower.toString()}W</p>
                    </div>
                ))}
            </div>

            {/* Reward claim */}
            <div className="panel-card">
                <h3>🎁 Claimable rewards</h3>
                <p>
                    Estimated reward:
                    {rewardPreview && ethers.BigNumber.isBigNumber(rewardPreview)
                        ? ethers.utils.formatUnits(rewardPreview, 18)
                        : "Loading..."} SOLR
                </p>


                {/* ✅ Countdown */}
                {cooldownRemaining === null ? (
                    <p>⏳ Loading cooldown...</p>
                ) : cooldownRemaining > 0 ? (
                    <p>⏳ Time until next claim: {Math.floor(cooldownRemaining / 60)}m {cooldownRemaining % 60}s</p>
                ) : (
                    <p>✅ You can claim rewards now!</p>
                )}
                {poolBalance && (
                    <p>🎯 Current reward pool balance: {ethers.utils.formatUnits(poolBalance, 18)} SOLR</p>
                )}

                <button
                    className="button"
                    onClick={claimReward}
                    disabled={cooldownRemaining > 0}
                >
                    Claim reward
                </button>
            </div>


            {/* Admin deposit panel */}
            {isOwner && (
                <div className="panel-card">
                          <h3>🧑‍💼 Admin SOLR Deposit</h3>
                          <input type="number" placeholder="Enter deposit amount" value={depositAmount}
                           onChange={(e) => setDepositAmount(e.target.value)} style={{color: "black"}}/>
                          <button className="button" onClick={deposit}>Deposit to reward pool</button>
                </div>
            )}
        </div>
    );
};

export default TestReward;
