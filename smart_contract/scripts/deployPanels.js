const hre = require("hardhat");

async function main() {
    console.log("🚀 部署 SolarPanels 合约...");

    const SolarPanels = await hre.ethers.getContractFactory("SolarPanels");
    const solarPanels = await SolarPanels.deploy();

    await solarPanels.waitForDeployment();

    console.log(`✅ SolarPanels 合约已部署到: ${solarPanels.target}`);
}

// 🚨 运行部署脚本
main().catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exitCode = 1;
});

