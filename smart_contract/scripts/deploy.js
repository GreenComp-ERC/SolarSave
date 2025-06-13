const hre = require("hardhat");

async function main() {
  const { ethers } = hre; // ✅ 从 hre 中安全解构
  const [sender] = await ethers.getSigners();

  const to = "0x1d78aB9A7744430d64a5D9659E4FcB933Be78080";
  const amount = ethers.utils.parseEther("0.1");

  const tx = await sender.sendTransaction({
    to,
    value: amount
  });

  console.log("✅ 发送成功，交易哈希:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
