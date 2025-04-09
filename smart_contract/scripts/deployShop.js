const hre = require("hardhat");

async function main() {
    console.log("🚀 部署 Shop 合约...");

    // 🔄 ERC20 代币合约地址 (⚠️ 请替换为你的代币地址)
    const tokenAddress = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA";

    // ✅ 获取合约工厂
    const Shop = await hre.ethers.getContractFactory("Shop");

    // 🚀 部署合约 (⚠️ 这里加上 `await` 才能正确获取 `shop`)
    const shop = await Shop.deploy(tokenAddress);
    console.log("📜 合约部署交易发送，等待确认...");

    // ✅ 等待部署完成
    await shop.waitForDeployment();  // 🚀 修复 `shop.deployed is not a function`

    // ✅ 获取部署后的合约地址
    const shopAddress = await shop.getAddress();
    console.log(`✅ Shop 合约已成功部署到: ${shopAddress}`);
}

// 🚨 运行部署脚本
main().catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exitCode = 1;
});
