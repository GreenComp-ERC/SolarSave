const { ethers } = require("hardhat");

async function main() {
    const SolarToken = await ethers.getContractFactory("CaoCaoBit");
    const token = await SolarToken.deploy(); // ⚠ 确保这里是 `deploy()`，没有参数

    await token.waitForDeployment(); // ⚠ 使用 `waitForDeployment()` 代替 `deployed()`

    console.log(`🚀 SolarToken 部署成功！合约地址: ${token.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
