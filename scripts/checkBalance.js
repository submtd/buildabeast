const hre = require("hardhat");
const mysql = require("mysql2/promise");
require("dotenv").config();
const update = true;

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    const Fbomb = await hre.ethers.getContractFactory("Fbomb");
    const fbomb = await Fbomb.attach(hre.network.config.contract_address);
    const MintProxy = await hre.ethers.getContractFactory("MintProxy");
    const mintproxy = await MintProxy.attach(hre.network.config.airdrop_address);
    const totalSupply = await fbomb.totalSupply();
    let owner;
    let balance;
    let airdropped;
    let minted;
    const addresses = [];
    const d = new Date();
    const datestring = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
    console.log('Total supply: ' + totalSupply);
    for (let i = 1; i <= totalSupply; i++) {
        owner = await fbomb.ownerOf(i);
        let [rows, fields] = await connection.query('SELECT * FROM `nfts` WHERE `id` = ?', [i]);
        if(typeof rows[0] == 'undefined') {
            await connection.query('INSERT INTO `nfts` (`id`, `address`) VALUES (?, ?)', [i, owner]);
        } else {
            await connection.query('UPDATE `nfts` SET `address` = ? WHERE `id` = ?', [owner, i]);
        }
        if(addresses.includes(owner)) {
            continue;
        }
        balance = (await fbomb.balanceOf(owner)).toString();
        airdropped = (await mintproxy.mintedByAddress(owner)).toString();
        minted = balance - airdropped;
        console.log(owner + ' has a balance of ' + balance + ' and has claimed ' + airdropped + ' free mints');
        [rows, fields] = await connection.query('SELECT * FROM `addresses` WHERE `address` = ?', [owner]);
        if(typeof rows[0] == 'undefined') {
            console.log('INSERTING', owner, balance, minted, airdropped);
            await connection.query('INSERT INTO `addresses` (`address`, `owned`, `minted`, `airdrop_minted`) VALUES (?, ?, ?, ?)', [owner, balance, minted, airdropped]);
        } else if(update) {
            console.log('UPDATING', owner, balance, minted, airdropped);
            await connection.query('UPDATE `addresses` SET `owned` = ?, `minted` = ?, `airdrop_minted` = ? WHERE `address` = ?', [balance, minted, airdropped, owner]);
        }
        [rows, fields] = await connection.query('SELECT * FROM `balances` WHERE `address` = ? AND `balance_date` = ?', [owner, datestring]);
        if(typeof rows[0] == 'undefined') {
            await connection.query('INSERT INTO `balances` (`address`, `balance`, `minted`, `airdrop_minted`, `balance_date`) VALUES (?, ?, ?, ?, ?)', [owner, balance, minted, airdropped, datestring]);
        } else {
            await connection.query('UPDATE `balances` SET `balance` = ?, `minted` = ?, `airdrop_minted` = ? WHERE `address` = ? AND `balance_date` = ?', [balance, minted, airdropped, owner, datestring]);
        }
        addresses.push(owner);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
