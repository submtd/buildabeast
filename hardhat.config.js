const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("dotenv").config();


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    networks: {
        rinkeby: {
            url: process.env.RINKEBY_RPC_URL || '',
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        mainnet: {
            url: process.env.MAINNET_RPC_URL || '',
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        polygon: {
            url: process.env.POLYGON_RPC_URL || '',
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        }
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
                runs: 5000,
            },
        },
    },
};
