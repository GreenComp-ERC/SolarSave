import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import SolarPanelsABI from "../../utils/test/SolarPanels.json";
import PowerRewardABI from "../../utils/test/PowerReward.json";
import "../../style/TestPanels.css";
import ERC20ABI from "../../utils/test/SolarToken.json"; // ✅ 引入 SOLR ABI
const rewardTokenAddress = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e"; // ✅ 替换成你部署的 SOLR 合约地址
const solarPanelAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0"; // 替换为你的合约地址
const powerRewardAddress = "0x6CACbd2FfC69843Ef182C365a16CDB6552600326"; // 替换为你的合约地址

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
    useEffect(() => {
        connect();
    }, []);
    useEffect(() => {
    const interval = setInterval(() => {
        if (lastClaimedAt !== null) {
            const now = Math.floor(Date.now() / 1000);
            const nextClaim = lastClaimedAt + 3600;
            const remaining = nextClaim - now;
            setCooldownRemaining(remaining > 0 ? remaining : 0);
        }
    }, 1000);

    return () => clearInterval(interval);
}, [lastClaimedAt]);


    const connect = async () => {
    if (!window.ethereum) {
        alert("请安装 MetaMask");
        return;
    }

    // ✅ 1. 初始化 provider 和 signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    setAccount(userAddress);
    console.log("当前账户地址：", userAddress); // ✅ 加上这个就能看到了

    // ✅ 2. 初始化合约实例
    const panelContract = new ethers.Contract(solarPanelAddress, SolarPanelsABI.abi, signer);
    const rewardCtr = new ethers.Contract(powerRewardAddress, PowerRewardABI.abi, signer);
    const token = new ethers.Contract(rewardTokenAddress, ERC20ABI.abi, signer);

    // ✅ 3. 更新合约状态
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

    const last = await rewardCtr.lastClaimedAt(userAddress);
    setLastClaimedAt(last.toNumber());
};




    const claimReward = async () => {
        try {
            const tx = await rewardContract.claimReward();
            await tx.wait();
            alert("✅ 奖励领取成功！");
            connect();
        } catch (e) {
            console.error("❌ 领取失败", e);
            alert("❌ 奖励领取失败！");
        }
    };

    const deposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
        alert("请输入有效的充值数量！");
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // 初始化 SOLR 合约实例
        const token = new ethers.Contract(rewardTokenAddress, ERC20ABI.abi, signer);
        const parsedAmount = ethers.utils.parseUnits(depositAmount, 18);

        // 1️⃣ 授权 SOLR 给 PowerReward 合约
        const approveTx = await token.approve(powerRewardAddress, parsedAmount);
        await approveTx.wait();
        console.log("✅ 授权成功");

        // 2️⃣ 执行充值
        const depositTx = await rewardContract.deposit(parsedAmount);
        await depositTx.wait();
        alert("✅ 充值成功！");
    } catch (e) {
        console.error("❌ 充值失败:", e);
        alert("❌ 充值失败，请检查授权或网络！");
    }
};


    return (
        <div className="panel-container">
            <h2>💰 PowerReward 奖励中心</h2>
            <p className="account-text">当前地址：{account}</p>

            {/* 显示面板 */}
            <div className="panel-card">
                <h3>我的太阳能板</h3>
                {panels.length === 0 ? <p>暂无面板</p> : panels.map((p, i) => (
                    <div className="panel-item" key={i}>
                        <p>📌 ID: {p.id.toString()}</p>
                        <p>📍 位置: ({p.latitude.toString()}, {p.longitude.toString()})</p>
                        <p>🔥 温度: {p.batteryTemperature.toString()}°C</p>
                        <p>⚡ DC 功率: {p.dcPower.toString()}W</p>
                        <p>🔌 AC 功率: {p.acPower.toString()}W</p>
                    </div>
                ))}
            </div>

            {/* 奖励领取 */}
            <div className="panel-card">
                <h3>🎁 可领取奖励</h3>
                <p>
                    预计奖励：
                    {rewardPreview && ethers.BigNumber.isBigNumber(rewardPreview)
                        ? ethers.utils.formatUnits(rewardPreview, 18)
                        : "加载中..."} SOLR
                </p>


                {/* ✅ 倒计时区域 */}
                {cooldownRemaining !== null && cooldownRemaining > 0 ? (
                    <p>⏳ 距离下次可领取还有：{Math.floor(cooldownRemaining / 60)}分 {cooldownRemaining % 60}秒</p>
                ) : (
                    <p>✅ 现在可以领取奖励！</p>
                )}
                {poolBalance && (
                    <p>🎯 当前奖池余额：{ethers.utils.formatUnits(poolBalance, 18)} SOLR</p>
                )}

                <button
                    className="button"
                    onClick={claimReward}
                    disabled={cooldownRemaining > 0}
                >
                    领取奖励
                </button>
            </div>


            {/* 管理员充值面板 */}
            {isOwner && (
                <div className="panel-card">
                    <h3>🧑‍💼 管理员 SOLR 充值</h3>
                    <input type="number" placeholder="输入充值数量" value={depositAmount}
                           onChange={(e) => setDepositAmount(e.target.value)} style={{color: "black"}}/>
                    <button className="button" onClick={deposit}>充值到奖励池</button>
                </div>
            )}
        </div>
    );
};

export default TestReward;
