const hre = require("hardhat");
const EthCrypto = require("eth-crypto");
const mysql = require("mysql2");
const encoder = hre.ethers.utils.defaultAbiCoder;
require("dotenv").config();
const key = process.env.PRIVATE_KEY;
let connection;
let fbomb;

async function main() {
    await connect();
    await getContract();
    await getHolders();
    await updateRecords();
}

async function connect() {
    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
}

async function getContract() {
    const Fbomb = await hre.ethers.getContractFactory("Fbomb");
    fbomb = await Fbomb.attach(hre.network.config.contract_address);
}

async function getHolders() {
    const totalSupply = await fbomb.totalSupply();
    console.log('Total supply: ' + totalSupply);
    //for (let i = 1; i <= totalSupply; i++) {
    for (let i = 1; i <= 3; i++) {
        var owner = await fbomb.ownerOf(i);
        console.log(owner + ' owns F-Bomb #' + i);
        const sql = "SELECT * FROM `airdrops` WHERE `address` = ? LIMIT 1";
        connection.query({ sql, values: [owner] }, function (error, [record], fields) {
            if(typeof record == 'undefined') {
                const sql = "INSERT INTO `airdrops` (address) VALUES (?)";
                connection.query({ sql, values: [owner] });
            }
        });
    }
}

async function updateRecords() {
    const sql = "SELECT * FROM `airdrops`";
    connection.query({ sql }, async function(error, records, fields) {
        records.forEach(async result => {
            var quantity = await fbomb.balanceOf(result.address);
            console.log(quantity);
        });
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
