const hre = require("hardhat");
const { writeAddresses } = require("./addressStore");

async function main() {
  const { ethers } = hre;
  const [owner, ...signers] = await ethers.getSigners();

  console.log("\nDeploying contracts...");

  const SolarToken = await ethers.getContractFactory("SolarToken");
  const token = await SolarToken.deploy();
  await token.waitForDeployment();

  const SolarPanels = await ethers.getContractFactory("SolarPanels");
  const panels = await SolarPanels.deploy();
  await panels.waitForDeployment();

  const Shop = await ethers.getContractFactory("Shop");
  const shop = await Shop.deploy(token.target, panels.target);
  await shop.waitForDeployment();

  const PowerReward = await ethers.getContractFactory("PowerReward");
  const reward = await PowerReward.deploy(token.target, panels.target);
  await reward.waitForDeployment();

  writeAddresses({
    token: token.target,
    solarPanels: panels.target,
    shop: shop.target,
    powerReward: reward.target,
  });

  console.log("\nContracts deployed:");
  console.log("- SolarToken:", token.target);
  console.log("- SolarPanels:", panels.target);
  console.log("- Shop:", shop.target);
  console.log("- PowerReward:", reward.target);

  try {
    const authorizeTx = await panels.setShopContract(shop.target);
    await authorizeTx.wait();
    console.log("\nShop contract authorized in SolarPanels.");
  } catch (error) {
    console.warn("\nShop authorization skipped:", error.message);
  }

  const airdropAmount = ethers.parseEther(process.env.AIRDROP_AMOUNT || "1000");
  const fundAmount = ethers.parseEther(process.env.REWARD_FUND_AMOUNT || "10000");

  const recipients = (process.env.AIRDROP_ACCOUNTS || "")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  const defaultRecipients = signers.slice(0, 5).map((s) => s.address);
  const targetRecipients = recipients.length > 0 ? recipients : defaultRecipients;

  console.log("\nAirdropping SOLR...");
  for (const recipient of targetRecipients) {
    const tx = await token.mint(recipient, airdropAmount);
    await tx.wait();
  }
  console.log("Airdrop complete:", targetRecipients.join(", "));

  console.log("\nFunding reward pool...");
  const approveTx = await token.approve(reward.target, fundAmount);
  await approveTx.wait();
  const depositTx = await reward.deposit(fundAmount);
  await depositTx.wait();
  console.log("Reward pool funded:", fundAmount.toString());
}

main().catch((error) => {
  console.error("\nDeployment failed:", error);
  process.exitCode = 1;
});
