const hre = require("hardhat");

async function main() {
  const { ethers } = hre; // ✅ Safely destructure from hre
  const [sender] = await ethers.getSigners();

  const to = "0x1d78aB9A7744430d64a5D9659E4FcB933Be78080";
  const amount = ethers.utils.parseEther("0.1");

  const tx = await sender.sendTransaction({
    to,
    value: amount
  });

  console.log("✅ Sent successfully, tx hash:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
