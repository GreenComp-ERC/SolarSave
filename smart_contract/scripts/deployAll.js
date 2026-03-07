const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { writeAddresses } = require("./addressStore");

const writeSimulatorEnv = (privateKey) => {
  if (!privateKey) {
    console.warn("\nSkipping simulator env sync: DEPLOYER_PRIVATE_KEY or SIMULATOR_PRIVATE_KEY not set.");
    return;
  }

  const envPath = path.join(__dirname, "..", "..", "Simulator", ".env");
  const envLines = [
    "ENABLE_ENERGY_SIM=true",
    `SIMULATOR_PRIVATE_KEY=${privateKey}`,
    "SIMULATOR_RPC_URL=http://127.0.0.1:8545",
    "SIMULATOR_STEP_SECONDS=60"
  ];

  fs.writeFileSync(envPath, envLines.join("\n") + "\n", { encoding: "utf-8" });
  console.log("\nSimulator .env synced:", envPath);
  console.log("Restart the simulator to apply new settings.");
};

const resolveSimulatorKey = (ownerAddress, ethers) => {
  const explicitKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.SIMULATOR_PRIVATE_KEY || "";
  if (explicitKey) {
    return explicitKey;
  }

  const mnemonic = process.env.HARDHAT_MNEMONIC || "test test test test test test test test test test test junk";
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    if (wallet.address.toLowerCase() === ownerAddress.toLowerCase()) {
      return wallet.privateKey;
    }
    console.warn("\nSkipping simulator env sync: derived mnemonic address does not match deployer.");
  } catch (error) {
    console.warn("\nSkipping simulator env sync: failed to derive private key from mnemonic.");
  }

  return "";
};

async function main() {
  const { ethers } = hre;
  const [owner, ...signers] = await ethers.getSigners();
  const simulatorKey = resolveSimulatorKey(owner.address, ethers);

  console.log("\nDeploying contracts...");

  const SolarToken = await ethers.getContractFactory("SolarToken");
  const token = await SolarToken.deploy();
  await token.waitForDeployment();

  const SolarPanels = await ethers.getContractFactory("SolarPanels");
  const panels = await SolarPanels.deploy();
  await panels.waitForDeployment();

  const FactoryRegistry = await ethers.getContractFactory("FactoryRegistry");
  const factory = await FactoryRegistry.deploy();
  await factory.waitForDeployment();

  const EnergyExchange = await ethers.getContractFactory("EnergyExchange");
  const energyExchange = await EnergyExchange.deploy(token.target);
  await energyExchange.waitForDeployment();

  const Shop = await ethers.getContractFactory("Shop");
  const shop = await Shop.deploy(token.target, panels.target);
  await shop.waitForDeployment();

  const PowerReward = await ethers.getContractFactory("PowerReward");
  const reward = await PowerReward.deploy(token.target, panels.target);
  await reward.waitForDeployment();

  writeAddresses({
    token: token.target,
    solarPanels: panels.target,
    factory: factory.target,
    energyExchange: energyExchange.target,
    shop: shop.target,
    powerReward: reward.target,
  });

  console.log("\nContracts deployed:");
  console.log("- SolarToken:", token.target);
  console.log("- SolarPanels:", panels.target);
  console.log("- FactoryRegistry:", factory.target);
  console.log("- EnergyExchange:", energyExchange.target);
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

  console.log("\nFunding exchange reward pool...");
  const exchangeFundTx = await token.mint(energyExchange.target, fundAmount);
  await exchangeFundTx.wait();
  console.log("Exchange pool funded:", fundAmount.toString());

  writeSimulatorEnv(simulatorKey);
}

main().catch((error) => {
  console.error("\nDeployment failed:", error);
  process.exitCode = 1;
});
