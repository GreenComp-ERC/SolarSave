const hre = require("hardhat");
const { writeAddresses } = require("./addressStore");

async function main() {
    console.log("🚀 Deploying SolarPanels contract...");

    const SolarPanels = await hre.ethers.getContractFactory("SolarPanels");
    const solarPanels = await SolarPanels.deploy();

    await solarPanels.waitForDeployment();

    writeAddresses({ solarPanels: solarPanels.target });
    console.log(`✅ SolarPanels contract deployed to: ${solarPanels.target}`);
}

// 🚨 Run the deployment script
main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});

