const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const Fbomb = await hre.ethers.getContractFactory("Fbomb");
    const fbomb = await Fbomb.deploy();
    await fbomb.deployed();
    console.log("Transaction created:", fbomb.deployTransaction.hash);
    console.log("Contract deployed to:", fbomb.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });