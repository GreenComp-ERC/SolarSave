async function main() {
    //使用hardhat.config.js network字段里指定的网段
    //比如，npx hardhat run scripts/deploy.js --network ganache，表示使用ganache网段
    //      npx hardhat run scripts/deploy.js --network rinkeby，表示使用rinkeby网段
    //      npx hardhat run scripts/deploy.js --network ropsten，表示使用ropsten网段
    //  ethers.getSigners是根据--network参数来获取对应的网段，
    //  若没有填写--network,则使用hardhat自带的测试网络: hardhat-test
    //  比如，npx hardhat run scripts/deploy.js ，则表示使用 hardhat-test网段(端口为8545)
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();

    console.log("Token address:", token.address);
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
