const hre = require("hardhat");

async function main() {
  const MessageStore = await hre.ethers.getContractFactory("MessageStore");
  const messageStore = await MessageStore.deploy();
  await messageStore.deployed();

  console.log("MessageStore deployed to:", messageStore.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
