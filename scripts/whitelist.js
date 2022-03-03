const hre = require("hardhat");
const EthCrypto = require('eth-crypto');
const fs = require('fs');

require("dotenv").config();

const key = process.env.PRIVATE_KEY;
const encoder = hre.ethers.utils.defaultAbiCoder;

async function main() {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    const [rows, fields] = await connection.query('SELECT * FROM `addresses`');
    rows.forEach(async result => {
        try {
            let whitelist_hash;
            let presale_hash;
            if(result.on_whitelist) {
                let encoded = hre.ethers.utils.sha256(encoder.encode(['address', 'uint256'], [result.address, 1]));
                whitelist_hash = EthCrypto.sign(key, encoded);
            }
            if(result.on_presale) {
                let encoded = hre.ethers.utils.sha256(encoder.encode(['address', 'uint256'], [result.address, 2]));
                presale_hash = EthCrypto.sign(key, encoded);
            }
            if(typeof whitelist_hash != 'undefined' && typeof presale_hash == 'undefined') {
                await connection.query('UPDATE addresses SET whitelist_hash="' + whitelist_hash + '" WHERE id=' + result.id);
            }
            if(typeof presale_hash != 'undefined' && typeof whitelist_hash == 'undefined') {
                await connection.query('UPDATE addresses SET presale_hash="' + presale_hash + '" WHERE id=' + result.id);
            }
            if(typeof whitelist_hash != 'undefined' && typeof presale_hash != 'undefined') {
                await connection.query('UPDATE addresses SET whitelist_hash="' + whitelist_hash + '", presale_hash="' + presale_hash + '" WHERE id=' + result.id);
            }
            console.log('processed ' + result.address);
        } catch(error) {
            console.log(error.message);
        }
    });
    await connection.end();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
