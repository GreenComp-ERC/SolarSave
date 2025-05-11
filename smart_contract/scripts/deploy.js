// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  // 获取合约工厂
  const CaoCaoBit = await ethers.getContractFactory("CaoCaoBit");

  // 部署合约
  const ccb = await CaoCaoBit.deploy();
  await ccb.waitForDeployment();

  // 获取部署地址
  console.log("✅ CaoCaoBit deployed to:", await ccb.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
