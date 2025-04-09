import { ethers } from "ethers";
import Shop from "./Shop.json"; // ✅ Shop 合约 ABI
import SolarToken from "./SolarToken.json"; // ✅ ERC20 代币合约 ABI

// ✅ 替换成你的实际合约地址
const shopContractAddress = "0x1Db966576e4e8e241001Da050FFd80CCabAA8B99";
const tokenContractAddress = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA"; // ⚠️ 替换为你的 SolarToken 合约地址

// ✅ 连接 MetaMask 并获取 provider 和 signer
const getProviderAndSigner = async () => {
    if (!window.ethereum) {
        alert("请安装 MetaMask!");
        return null;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" }); // 请求连接 MetaMask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return { provider, signer };
};

// ✅ 获取 `Shop` 合约实例
export const getContract = async () => {
    try {
        const { signer } = await getProviderAndSigner();
        if (!signer) return null;

        console.log("Shop 结构:", Shop);

        // ✅ 确保 `Shop.abi` 存在，并且是数组
        if (!Shop.abi || !Array.isArray(Shop.abi)) {
            console.error("❌ Shop ABI 结构错误！请检查 `Shop.json` 文件。");
            return null;
        }

        console.log("✅ Shop ABI 结构正确，创建合约实例...");
        const contract = new ethers.Contract(shopContractAddress, Shop.abi, signer);

        console.log("✅ Shop 合约实例创建成功:", contract);
        return contract;
    } catch (error) {
        console.error("❌ 获取 Shop 合约失败:", error);
        return null;
    }
};

// ✅ 获取 `SolarToken` 代币合约实例
export const getTokenContract = async () => {
    try {
        const { signer } = await getProviderAndSigner();
        if (!signer) return null;

        console.log("SolarToken 结构:", SolarToken);

        // ✅ 确保 `SolarToken.abi` 存在，并且是数组
        if (!SolarToken.abi || !Array.isArray(SolarToken.abi)) {
            console.error("❌ SolarToken ABI 结构错误！请检查 `SolarToken.json` 文件。");
            return null;
        }

        console.log("✅ SolarToken ABI 结构正确，创建合约实例...");
        const tokenContract = new ethers.Contract(tokenContractAddress, SolarToken.abi, signer);

        console.log("✅ SolarToken 合约实例创建成功:", tokenContract);
        return tokenContract;
    } catch (error) {
        console.error("❌ 获取 SolarToken 合约失败:", error);
        return null;
    }
};
