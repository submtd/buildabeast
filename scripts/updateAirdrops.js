const hre = require("hardhat");
const EthCrypto = require("eth-crypto");
const mysql = require("mysql2/promise");
const encoder = hre.ethers.utils.defaultAbiCoder;
require("dotenv").config();
const balanceMultiplier = 2;
const update = true;

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    const key = hre.network.config.private_key;
    const Fbomb = await hre.ethers.getContractFactory("Fbomb");
    const fbomb = await Fbomb.attach(hre.network.config.contract_address);
    const totalSupply = await fbomb.totalSupply();
    console.log('Total supply: ' + totalSupply);
    for (let i = 1; i <= totalSupply; i++) {
        console.log('Finding owner of F-Bomb #', i);
        const owner = await fbomb.ownerOf(i);
        const [rows, fields] = await connection.query('SELECT * FROM `addresses` WHERE `address` = ?', [owner]);
        if(typeof rows[0] == 'undefined') {
            const balance = await fbomb.balanceOf(owner) * 1;
            console.log('INSERTING', owner, balance);
            const hash = getSignature(key, owner, balance * balanceMultiplier, 1);
            await connection.query('INSERT INTO `addresses` (`address`, `owned`, `airdrop_quantity`, `airdrop_hash`) VALUES (?, ?, ?, ?)', [owner, balance, balance * balanceMultiplier, hash]);
        } else if(update) {
            const balance = await fbomb.balanceOf(owner) * 1;
            console.log('UPDATING', owner, balance);
            const hash = getSignature(key, owner, balance * balanceMultiplier, 1);
            await connection.query('UPDATE `addresses` SET `owned` = ?, `airdrop_quantity` = ?, `airdrop_hash` = ? WHERE `address` = ?', [balance * 1, balance * balanceMultiplier, hash, owner]);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const getSignature = (pkey, address, assignedQuantity, mintVersion) => {
    const encoder = hre.ethers.utils.defaultAbiCoder;
    let messageHash = hre.ethers.utils.sha256(encoder.encode(['address', 'uint256', 'uint256'], [address, assignedQuantity, mintVersion]));
    return EthCrypto.sign(pkey, messageHash);
};
