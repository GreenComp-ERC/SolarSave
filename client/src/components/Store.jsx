import React, { useEffect, useState } from "react";
import { getContract, getTokenContract } from "../utils/contract"; // ✅ 需要同时获取 Shop & Token 合约
import { ethers } from "ethers";

const Store = () => {
    const [items, setItems] = useState([]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [contract, setContract] = useState(null);
    const [tokenContract, setTokenContract] = useState(null);
    const [account, setAccount] = useState("");

    useEffect(() => {
        checkWalletConnection();
    }, []);

    // 🔹 检查 MetaMask 连接
    const checkWalletConnection = async () => {
        if (!window.ethereum) {
            alert("请安装 MetaMask 扩展！");
            return;
        }
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0) {
                setWalletConnected(true);
                setAccount(accounts[0]);
                console.log("钱包已连接:", accounts[0]);

                const shopContractInstance = await getContract();
                const tokenContractInstance = await getTokenContract();
                setContract(shopContractInstance);
                setTokenContract(tokenContractInstance);

                loadItems(shopContractInstance);
            } else {
                alert("请连接您的 MetaMask 钱包！");
            }
        } catch (error) {
            console.error("检查钱包失败:", error);
        }
    };

    // 🔹 读取商品列表
    const loadItems = async () => {
        try {
            const shopContract = await getContract();
            if (!shopContract) {
                console.error("❌ 获取 Shop 合约失败！");
                return;
            }

            console.log("✅ Shop 合约实例成功获取:", shopContract);

            const itemCount = await shopContract.itemCount();
            let loadedItems = [];
            for (let i = 1; i <= itemCount; i++) {
                const item = await shopContract.getItem(i);
                if (!item.purchased) {
                    loadedItems.push({
                        id: item.id.toNumber(),
                        name: item.name,
                        price: ethers.utils.formatEther(item.price),
                        seller: item.seller,
                    });
                }
            }
            setItems(loadedItems);
        } catch (error) {
            console.error("加载商品失败:", error);
        }
    };

    // 🔹 上架商品
    const listItem = async () => {
        if (!walletConnected) {
            alert("请先连接钱包！");
            return;
        }

        if (!name || !price || isNaN(price) || Number(price) <= 0) {
            alert("请输入有效的商品名称和价格！");
            return;
        }

        setLoading(true);
        try {
            console.log("开始上架商品...");
            if (!contract) {
                console.error("未找到 Shop 合约实例！");
                return;
            }

            const tx = await contract.listItem(name, ethers.utils.parseEther(price));
            console.log("交易已发送:", tx.hash);
            await tx.wait();
            console.log("✅ 上架成功！");
            loadItems();
            setName("");
            setPrice("");
        } catch (error) {
            console.error("上架失败:", error);
            alert("上架失败，请检查您的钱包余额或网络连接。");
        }
        setLoading(false);
    };

    // 🔹 购买商品（ERC20 代币支付）
    const buyItem = async (id, price) => {
        if (!walletConnected) {
            alert("请先连接钱包！");
            return;
        }

        setLoading(true);
        try {
            console.log(`购买商品 ID: ${id}, 价格: ${price} SOLR`);

            if (!contract || !tokenContract) {
                console.error("未找到合约实例！");
                return;
            }

            const priceInWei = ethers.utils.parseUnits(price, 18); // ✅ 确保单位转换正确

            // 🟡 检查 SOLR 代币余额
            const balance = await tokenContract.balanceOf(account);
            if (balance.lt(priceInWei)) {
                return alert("❌ 余额不足，请确保您的 SOLR 代币足够！");
            }

            // 🟡 检查授权额度
            const allowance = await tokenContract.allowance(account, contract.address);
            console.log(`当前授权额度: ${ethers.utils.formatEther(allowance)} SOLR`);

            if (allowance.lt(priceInWei)) {
                alert("🔄 授权不足，正在进行授权...");
                const approveTx = await tokenContract.approve(contract.address, priceInWei);
                await approveTx.wait();
                alert("✅ 授权成功！");
            }

            // 🔹 购买商品（Gas 由买家支付）
            const tx = await contract.buyItem(id);
            console.log("交易已发送:", tx.hash);
            await tx.wait();
            console.log("✅ 购买成功！");
            loadItems();
        } catch (error) {
            console.error("购买失败:", error);
            alert("❌ 购买失败，请检查授权是否正确！");
        }
        setLoading(false);
    };

    return (
        <div>
            <h2>🛒 商店</h2>

            {/* 🔹 连接钱包按钮 */}
            {!walletConnected ? (
                <button onClick={checkWalletConnection} className="wallet-button">
                    连接钱包
                </button>
            ) : (
                <p>钱包已连接: {account}</p>
            )}

            {/* 🔹 上架商品 */}
            <div>
                <input
                    type="text"
                    placeholder="物品名称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
                <input
                    type="text"
                    placeholder="价格（SOLR）"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                />
                <button onClick={listItem} disabled={loading}>
                    {loading ? "上架中..." : "上架物品"}
                </button>
            </div>

            {/* 🔹 商品列表 */}
            <ul>
                {items.length === 0 ? <p>暂无商品</p> : items.map((item) => (
                    <li key={item.id}>
                        {item.name} - {item.price} SOLR
                        <button onClick={() => buyItem(item.id, item.price)} disabled={loading}>
                            {loading ? "购买中..." : "购买"}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Store;
