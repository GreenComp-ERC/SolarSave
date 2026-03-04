require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const alchemyKey = process.env.ALCHEMY_API_KEY;
const sepoliaKey = process.env.SEPOLIA_PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true, // Enable optimizer
        runs: 200, // 200 optimizer runs to reduce gas
      },
    },
  },

  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey ?? ""}`,
      accounts: sepoliaKey ? [sepoliaKey] : [],
      gas: "auto", // Allow auto gas estimation
      gasPrice: 10000000000, // 10 Gwei (adjustable)
    },
  },

  mocha: {
    timeout: 200000, // Increase test timeout to avoid long compile timeouts
  },
};
