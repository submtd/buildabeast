const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const MintProxy = await hre.ethers.getContractFactory("MintProxy");
    const mintproxy = await MintProxy.deploy();
    await mintproxy.deployed();
    console.log("Transaction created:", mintproxy.deployTransaction.hash);
    console.log("Contract deployed to:", mintproxy.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
