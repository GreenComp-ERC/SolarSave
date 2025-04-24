const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`🚀 Deploying contracts with: ${deployer.address}`);

  const deployed = {};

  // 1️⃣ SolarToken（无参）
  const SolarToken = await hre.ethers.getContractFactory("SolarToken");
  const solarToken = await SolarToken.deploy();
  await solarToken.waitForDeployment();
  deployed.SolarToken = solarToken.target;
  console.log(`✅ SolarToken deployed at: ${solarToken.target}`);

  // 2️⃣ SolarPanels（无参）
  const SolarPanels = await hre.ethers.getContractFactory("SolarPanels");
  const solarPanels = await SolarPanels.deploy();
  await solarPanels.waitForDeployment();
  deployed.SolarPanels = solarPanels.target;
  console.log(`✅ SolarPanels deployed at: ${solarPanels.target}`);

  // 3️⃣ Shop（需要 token 和 solarPanels 地址）
  const Shop = await hre.ethers.getContractFactory("Shop");
  const shop = await Shop.deploy(solarToken.target, solarPanels.target);
  await shop.waitForDeployment();
  deployed.Shop = shop.target;
  console.log(`✅ Shop deployed at: ${shop.target}`);

  // 4️⃣ PowerReward（需要 token 和 solarPanels 地址）
  const PowerReward = await hre.ethers.getContractFactory("PowerReward");
  const reward = await PowerReward.deploy(solarToken.target, solarPanels.target);
  await reward.waitForDeployment();
  deployed.PowerReward = reward.target;
  console.log(`✅ PowerReward deployed at: ${reward.target}`);

  // 📄 保存所有地址到 JSON 文件
  const outputPath = path.resolve(__dirname, "../contractAddress.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployed, null, 2));
  console.log("📦 All contract addresses saved to contractAddress.json");
}

// 🚨 捕捉异常
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
