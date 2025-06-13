const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e";
  const solarPanelsAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";

  console.log("🚀 开始部署 Shop 合约...");
  const Shop = await hre.ethers.getContractFactory("Shop");
  const shop = await Shop.deploy(tokenAddress, solarPanelsAddress);

  await shop.waitForDeployment(); // ✅ 新版本 ethers 的部署等待方法

  console.log(`✅ Shop 合约已部署至: ${shop.target}`);
  console.log(`🔗 Token 地址: ${tokenAddress}`);
  console.log(`🔗 SolarPanels 地址: ${solarPanelsAddress}`);
}

main().catch((error) => {
  console.error("❌ 部署失败:", error);
  process.exit(1);
});
