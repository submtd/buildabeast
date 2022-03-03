const { expect } = require("chai");
const { ethers } = require("hardhat");
const EthCrypto = require('eth-crypto');
const { utils } = require("web3");

describe("F-Bomb", function () {
    let owner;
    let addr1;
    let addr2;
    let addrs;
    let ownerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    let whitelistType = 1;
    let presaleType = 2;
    let name = 'F-Bomb';
    let symbol = 'FBOMB';
    let baseTokenURI = 'ipfs://QmfM1KB2HHwSEiv2uUu97p728vyZhEU5fuw5qm9vi1BZdT/';
    let hiddenTokenURI = 'ipfs://QmS8wQqihMheMStSfSXoCNrfJSswVX67QuXdFb98PyNnX5';
    let maxForSale = 9899;
    let whitelistStart = 1643651940; // 1/31/2022 6pm GMT
    let whitelistMaxMint = 2;
    let whitelistPrice = '60000000000000000';
    let presaleStart = 1643738340; // 2/1/2022 6pm GMT
    let presaleMaxMint = 1;
    let presalePrice = '70000000000000000';
    let publicStart = 1643824740; // 2/2/2022 6pm GMT
    let publicMaxMint = 5;
    let publicPrice = '80000000000000000';

    beforeEach(async function () {
        Fbomb = await ethers.getContractFactory("Fbomb");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        fbomb = await Fbomb.deploy();
    });

    describe("Deployment", function () {
        it("Has the right name", async function () {
            expect(await fbomb.name()).to.equal(name);
        });
        it("Has the right symbol", async function () {
            expect(await fbomb.symbol()).to.equal(symbol);
        });
        it("Has the right baseTokenURI", async function () {
            expect(await fbomb.baseTokenURI()).to.equal('');
        });
        it("Has the right hiddenTokenURI", async function () {
            expect(await fbomb.hiddenTokenURI()).to.equal(hiddenTokenURI);
        });
        it("Has the right maxForSale", async function () {
            expect(await fbomb.maxForSale()).to.equal(maxForSale);
        });
        it("Has the right whitelistStart", async function () {
            expect(await fbomb.whitelistStart()).to.equal(whitelistStart);
        });
        it("Has the right whitelistMaxMint", async function () {
            expect(await fbomb.whitelistMaxMint()).to.equal(whitelistMaxMint);
        });
        it("Has the right whitelistPrice", async function () {
            expect(await fbomb.whitelistPrice()).to.equal(whitelistPrice);
        });
        it("Has the right presaleMaxMint", async function () {
            expect(await fbomb.presaleMaxMint()).to.equal(presaleMaxMint);
        });
        it("Has the right presalePrice", async function () {
            expect(await fbomb.presalePrice()).to.equal(presalePrice);
        });
        it("Has the right publicStart", async function () {
            expect(await fbomb.publicStart()).to.equal(publicStart);
        });
        it("Has the right publicMaxMint", async function () {
            expect(await fbomb.publicMaxMint()).to.equal(publicMaxMint);
        });
        it("Has the right publicPrice", async function () {
            expect(await fbomb.publicPrice()).to.equal(publicPrice);
        });
        it("Has the right maxForSale", async function () {
            expect(await fbomb.maxForSale()).to.equal(maxForSale);
        });
        it("Balance of owner is zero", async function () {
            expect(await fbomb.balanceOf(owner.address)).to.equal(0);
        });
        it("Has the right owner address", async function () {
            expect(await fbomb.owner()).to.equal(owner.address);
        });
        it("Has zero totalSupply", async function () {
            expect(await fbomb.totalSupply()).to.equal(0);
        });
    });
    describe("Minting", function () {
        it("Can adminMint for addr1 and maxForSale is incremented", async function () {
            await fbomb.adminMint(addr1.address, 1);
            expect(await fbomb.totalSupply()).to.equal(1);
            expect(await fbomb.balanceOf(addr1.address)).to.equal(1);
            expect(await fbomb.maxForSale()).to.equal(maxForSale + 1);
        });
        it("Cannot adminMint from non admin account", async function () {
            await expect(fbomb.connect(addr1).adminMint(addr1.address, 1)).to.be.reverted;
        });
        it("Can update whitelistStart", async function () {
            const timestamp = Date.now();
            await fbomb.setWhitelistStart(timestamp);
            expect(await fbomb.whitelistStart()).to.equal(timestamp);
        });
        it("Cannot whitelist mint before whitelistStart", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setWhitelistStart(timestamp + 86400);
            const signature = getSignature(ownerPrivateKey, owner.address, whitelistType);
            await expect(fbomb.whitelistMint(signature, 1, {value: whitelistPrice})).to.be.reverted;
        });
        it("Can whitelist mint with signature", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setWhitelistStart(timestamp);
            const signature = getSignature(ownerPrivateKey, owner.address, whitelistType);
            await fbomb.whitelistMint(signature, 1, {value: whitelistPrice});
            expect(await fbomb.totalSupply()).to.equal(1);
            expect(await fbomb.balanceOf(owner.address)).to.equal(1);
        });
        it("Cannot whitelist mint with presale signature", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setWhitelistStart(timestamp);
            const signature = getSignature(ownerPrivateKey, owner.address, presaleType);
            await expect(fbomb.whitelistMint(signature, 1, {value: whitelistPrice})).to.be.reverted;
        });
        it("Cannot whitelist mint more than whitelistMaxMint", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setWhitelistStart(timestamp);
            const signature = getSignature(ownerPrivateKey, owner.address, whitelistType);
            let priceForOne = ethers.BigNumber.from(whitelistPrice);
            let maxMint = ethers.BigNumber.from(whitelistMaxMint);
            let priceForMax = priceForOne.mul(maxMint);
            await fbomb.whitelistMint(signature, whitelistMaxMint, {value: priceForMax});
            await expect(fbomb.whitelistMint(signature, 1, {value: whitelistPrice})).to.be.reverted;
        });
        it("Can update presaleStart", async function () {
            const timestamp = Date.now();
            await fbomb.setPresaleStart(timestamp);
            expect(await fbomb.presaleStart()).to.equal(timestamp);
        });
        it("Can presale mint with signature", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPresaleStart(timestamp);
            const signature = getSignature(ownerPrivateKey, owner.address, presaleType);
            await fbomb.presaleMint(signature, 1, {value: presalePrice});
            expect(await fbomb.totalSupply()).to.equal(1);
            expect(await fbomb.balanceOf(owner.address)).to.equal(1);
        });
        it("Cannot presale mint before presaleStart", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPresaleStart(timestamp + 86400);
            const signature = getSignature(ownerPrivateKey, owner.address, presaleType);
            await expect(fbomb.presaleMint(signature, 1, {value: presalePrice})).to.be.reverted;
        });
        it("Cannot presale mint with whitelist signature", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPresaleStart(timestamp);
            const signature = getSignature(ownerPrivateKey, owner.address, whitelistType);
            await expect(fbomb.presaleMint(signature, 1, {value: presalePrice})).to.be.reverted;
        });
        it("Cannot presale mint more than presaleMaxMint", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPresaleStart(timestamp);
            const signature = getSignature(ownerPrivateKey, owner.address, presaleType);
            let priceForOne = ethers.BigNumber.from(presalePrice);
            let maxMint = ethers.BigNumber.from(presaleMaxMint);
            let priceForMax = priceForOne.mul(maxMint);
            await fbomb.presaleMint(signature, presaleMaxMint, {value: priceForMax});
            await expect(fbomb.presaleMint(signature, 1, {value: presalePrice})).to.be.reverted;
        });
        it("Can update publicStart", async function () {
            const timestamp = Date.now();
            await fbomb.setPublicStart(timestamp);
            expect(await fbomb.publicStart()).to.equal(timestamp);
        });
        it("Cannot mint before publicStart", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp + 86400);
            await expect(fbomb.publicMint(1, {value: publicPrice})).to.be.reverted;
        });
        it("Can mint after publicStart", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            await fbomb.publicMint(1, {value: publicPrice});
            expect(await fbomb.totalSupply()).to.equal(1);
            expect(await fbomb.balanceOf(owner.address)).to.equal(1);
        });
        it("Cannot public mint more than publicMaxMint", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            let priceForOne = ethers.BigNumber.from(publicPrice);
            let maxMint = ethers.BigNumber.from(publicMaxMint);
            let priceForMax = priceForOne.mul(maxMint);
            await fbomb.publicMint(publicMaxMint, {value: priceForMax});
            await expect(fbomb.publicMint(1, {value: publicPrice})).to.be.reverted;
        });
        it("Can mint on whitelist, presale, and public", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setWhitelistStart(timestamp);
            let t = 0;
            let signature;
            signature = getSignature(ownerPrivateKey, owner.address, 1);
            for(i = 0; i < whitelistMaxMint; i++) {
                t++;
                await fbomb.whitelistMint(signature, 1, {value: whitelistPrice});
                expect(await fbomb.balanceOf(owner.address)).to.equal(t);
            }
            await expect(fbomb.whitelistMint(signature, 1, {value: whitelistPrice})).to.be.reverted;
            await fbomb.setPresaleStart(timestamp);
            signature = getSignature(ownerPrivateKey, owner.address, 2);
            for(i = 0; i < presaleMaxMint; i++) {
                t++;
                await fbomb.presaleMint(signature, 1, {value: presalePrice});
                expect(await fbomb.balanceOf(owner.address)).to.equal(t);
            }
            await expect(fbomb.presaleMint(signature, 1, {value: presalePrice})).to.be.reverted;
            await fbomb.setPublicStart(timestamp);
            for(i = 0; i < publicMaxMint; i++) {
                t++;
                await fbomb.publicMint(1, {value: publicPrice});
                expect(await fbomb.balanceOf(owner.address)).to.equal(t);
            }
            await expect(fbomb.publicMint(1, {value: publicPrice})).to.be.reverted;
        });
        it("Returns the hidden tokenURI", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            await fbomb.publicMint(1, {value: publicPrice});
            expect(await fbomb.tokenURI(1)).to.equal(hiddenTokenURI);
        });
        it("Returns the real tokenURI after baseTokenURI is set", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            await fbomb.publicMint(1, {value: publicPrice});
            await fbomb.setBaseURI(baseTokenURI);
            expect(await fbomb.tokenURI(1)).to.equal(baseTokenURI + 1);
        });
        it("Returns correct tokenOfOwnerByIndex", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            await fbomb.publicMint(1, {value: publicPrice});
            expect(await fbomb.tokenOfOwnerByIndex(owner.address, 0)).to.equal(1);
        });
        it("Returns correct ownerOf", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            await fbomb.publicMint(1, {value: publicPrice});
            expect(await fbomb.ownerOf(1)).to.equal(owner.address);
        });
    });
    describe("Admin", function () {
        it("Can withdraw from owner account", async function () {
            timestamp = await getBlockTimestamp();
            await fbomb.setPublicStart(timestamp);
            expect(await ethers.provider.getBalance(fbomb.address)).to.equal(0);
            let ownerBalance = await ethers.provider.getBalance(owner.address);
            //await fbomb.setPublicStart(0);
            await fbomb.publicMint(1, {value: publicPrice});
            let newOwnerBalance = await ethers.provider.getBalance(owner.address);
            expect(newOwnerBalance).to.be.below(ownerBalance);
            expect(await ethers.provider.getBalance(fbomb.address)).to.equal(publicPrice);
            await fbomb.withdraw();
            expect(await ethers.provider.getBalance(owner.address)).to.be.above(newOwnerBalance);
            expect(await ethers.provider.getBalance(fbomb.address)).to.equal(0);
        });
        it("Cannot withdraw from non owner account", async function () {
            await expect(fbomb.connect(addr1).withdraw()).to.be.reverted;
        });
        it("Cannot transfer ownership from non owner account", async function () {
            await expect(fbomb.connect(addr1).transferOwnership(addr2.address)).to.be.reverted;
        });
        it("Can transfer ownership from owner account", async function () {
            await fbomb.transferOwnership(addr1.address);
            expect(await fbomb.owner()).to.equal(addr1.address);
            await expect(fbomb.transferOwnership(owner.address)).to.be.reverted;
            await fbomb.connect(addr1).transferOwnership(owner.address);
            expect(await fbomb.owner()).to.equal(owner.address);
        });
    });
});

async function getBlockTimestamp () {
    return (await hre.ethers.provider.getBlock("latest")).timestamp;
}

const getSignature = (pkey, address, type) => {
    const encoder = hre.ethers.utils.defaultAbiCoder;
    let messageHash = hre.ethers.utils.sha256(encoder.encode(['address', 'uint256'], [address, type]));
    return EthCrypto.sign(pkey, messageHash);
};