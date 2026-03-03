const { ethers } = require("hardhat");

async function main() {
    const SolarToken = await ethers.getContractFactory("SolarToken");
    const token = await SolarToken.deploy(); // ⚠ Ensure this is `deploy()` with no args

    await token.waitForDeployment(); // ⚠ Use `waitForDeployment()` instead of `deployed()`

    console.log(`🚀 SolarToken deployed successfully! Contract address: ${token.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
