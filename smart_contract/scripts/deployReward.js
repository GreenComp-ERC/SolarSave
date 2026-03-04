const hre = require("hardhat");
const { readAddresses, writeAddresses } = require("./addressStore");

async function main() {
  const stored = readAddresses();
  const tokenAddress = process.env.TOKEN_ADDRESS || stored.token;
  const solarPanelsAddress = process.env.SOLAR_PANELS_ADDRESS || stored.solarPanels;

  if (!tokenAddress || !solarPanelsAddress) {
    throw new Error("Missing token or SolarPanels address. Deploy them first or set TOKEN_ADDRESS and SOLAR_PANELS_ADDRESS.");
  }

  console.log("🚀 Starting PowerReward contract deployment...");
  const Shop = await hre.ethers.getContractFactory("PowerReward");
  const shop = await Shop.deploy(tokenAddress, solarPanelsAddress);

  await shop.waitForDeployment(); // ✅ Deployment wait for newer ethers

  writeAddresses({ powerReward: shop.target, token: tokenAddress, solarPanels: solarPanelsAddress });

  console.log(`✅ PowerReward contract deployed to: ${shop.target}`);
  console.log(`🔗 Token address: ${tokenAddress}`);
  console.log(`🔗 SolarPanels address: ${solarPanelsAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
