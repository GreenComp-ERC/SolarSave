const hre = require("hardhat");

async function main() {
    // ✅ 确保 ERC20 代币地址是字符串格式
    const tokenAddress = "0x1d78aB9A7744430d64a5D9659E4FcB933Be78080";

    console.log("🚀 正在部署 SolarTrade 合约...");

    // ✅ 使用 `getContractFactory` 以适配 Hardhat v2 + ethers v6
    const SolarTrade = await hre.ethers.deployContract("SolarTrade", [tokenAddress]);

    // ✅ `waitForDeployment()` 适用于 ethers v6
    await SolarTrade.waitForDeployment();

    console.log(`✅ SolarTrade 部署成功，地址: ${SolarTrade.target}`);

    // ✅ 将合约地址存储到前端的 `contractAddress.json`
    // const fs = require("fs");
    // const path = require("path");
    // const frontendPath = path.join(__dirname, "./contractAddress.json");
    //
    // fs.writeFileSync(frontendPath, JSON.stringify({ address: SolarTrade.target }, null, 2));
    //
    // console.log(`✅ 合约地址已存储到: frontend/src/utils/contractAddress.json`);
    console.log(`🚀 SolarToken 部署成功！合约地址: ${SolarTrade.target}`);
}

main().catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exitCode = 1;
});
