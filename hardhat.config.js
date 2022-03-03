const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balances", "Prints the list of account balances", async () => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    balance = await hre.ethers.provider.getBalance(account.address);
    console.log(account.address, "has balance", balance.toString());
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL || '',
      accounts: process.env.RINKEBY_PRIVATE_KEY ? [process.env.RINKEBY_PRIVATE_KEY] : [],
      contract_address: process.env.RINKEBY_CONTRACT_ADDRESS || '',
      airdrop_address: process.env.RINKEBY_AIRDROP_ADDRESS || '',
      private_key: process.env.RINKEBY_PRIVATE_KEY || '',
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || '',
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      contract_address: process.env.MAINNET_CONTRACT_ADDRESS || '',
      airdrop_address: process.env.MAINNET_AIRDROP_ADDRESS || '',
      private_key: process.env.MAINNET_PRIVATE_KEY || '',
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || ''
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
};
