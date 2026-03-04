const { ethers } = require("hardhat");
const { writeAddresses } = require("./addressStore");

async function main() {
    const SolarToken = await ethers.getContractFactory("SolarToken");
    const token = await SolarToken.deploy(); // ⚠ Ensure this is `deploy()` with no args

    await token.waitForDeployment(); // ⚠ Use `waitForDeployment()` instead of `deployed()`

    writeAddresses({ token: token.target });
    console.log(`🚀 SolarToken deployed successfully! Contract address: ${token.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
