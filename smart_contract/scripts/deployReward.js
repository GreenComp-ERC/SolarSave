const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x175da7583f3b085ac4Ab87AEd758c6Cd11A8b81e";
  const solarPanelsAddress = "0x39Cb00Cf33827D78892b1c83aF166CB7c4FCB3C0";

  console.log("🚀 Starting PowerReward contract deployment...");
  const Shop = await hre.ethers.getContractFactory("PowerReward");
  const shop = await Shop.deploy(tokenAddress, solarPanelsAddress);

  await shop.waitForDeployment(); // ✅ Deployment wait for newer ethers

  console.log(`✅ PowerReward contract deployed to: ${shop.target}`);
  console.log(`🔗 Token address: ${tokenAddress}`);
  console.log(`🔗 SolarPanels address: ${solarPanelsAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
