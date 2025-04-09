require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true, // 开启优化
        runs: 200, // 200 表示优化 200 次，减少 Gas 费用
      },
    },
  },

  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
      gas: "auto", // 允许自动计算 Gas 费用
      gasPrice: 10000000000, // 10 Gwei (可调整)
    },
  },

  mocha: {
    timeout: 200000, // 增加测试超时时间，防止超长合约编译超时
  },
};
