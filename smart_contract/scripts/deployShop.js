const hre = require("hardhat");

async function main() {
  const tokenAddress = "0xdb5e74FCCE02B552fD3Ef92dEFccB171edfB8edA";
  const solarPanelsAddress = "0x000b697FD091585bBA0C1e3f92c8Ba4A3Cc15B3d";

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
