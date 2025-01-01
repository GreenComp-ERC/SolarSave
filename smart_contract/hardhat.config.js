require('@nomiclabs/hardhat-waffle');
require("@nomiclabs/hardhat-ganache");
//test accounts
const PRIVATE_KEY1 = "94283177604c7183862e1985e6978ccb1f2f55a82e357fb3c15cbbff0724168f"
const PRIVATE_KEY2 = "96416b10e9dee1a0fbdd811a2cf8453f4706f2e84e78c8a7ba7ae6fd9500549c";
const PRIVATE_KEY3 = "1c80723a97d671eaa454ce9ca8253b0d01dafc008e018d39e6de3d4e0b3b7fc6";
const PRIVATE_KEY4 = "d15203dad2a0e2c84b634c1c50e6688b37836dbd2f77a796d34173d7c517b1b3";

module.exports = {
  // solidity: '0.8.0',
  solidity: {
        compilers: [    //可指定多个sol版本
            {version: "0.4.26"},
            {version: "0.8.0"},
            {version: "0.8.17"}
        ]
  },
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/z4WpA8UKgqnwbTYmrZu15yCOiijBKaRv',
      accounts: ['2f99db8cdb04655028eee1dc98230925202f6b3e010e43fad2883b4bea90a1a3'],
    },
    //deploying our tests on ganache test network
    ganache: {
      url: `http://127.0.0.1:7545`,
      accounts: [`0x${PRIVATE_KEY1}`,`0x${PRIVATE_KEY2}`,`0x${PRIVATE_KEY3}`,`0x${PRIVATE_KEY4}`]
    },

  },
};