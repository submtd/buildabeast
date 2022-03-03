const { expect } = require("chai");
const { ethers } = require("hardhat");
const EthCrypto = require("eth-crypto");

describe("MintProxy", function () {

    // PRIVATE KEYS FOR CREATING SIGNATURES
    let ownerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    let addr1PrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

    // RUN THIS BEFORE EACH TEST
    beforeEach(async function () {
        Fbomb = await ethers.getContractFactory("Fbomb");
        fbomb = await Fbomb.deploy();
        MintProxy = await ethers.getContractFactory("MintProxy");
        mintproxy = await MintProxy.deploy();
        await mintproxy.setTarget(fbomb.address);
        await fbomb.transferOwnership(mintproxy.address);
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        await mintproxy.setMintPrice(1000);
        await mintproxy.setMintMax(10);
        await mintproxy.activateMint();
    });

    describe("Deployment", function () {
        it("Has the correct mint version after deployment", async function () {
            expect(await mintproxy.mintVersion()).to.equal(1);
        });
        it("Has the correct mint price after deployment", async function () {
            expect(await mintproxy.mintPrice()).to.equal(1000);
        });
        it("Mint is active", async function () {
            expect(await mintproxy.mintActive()).to.equal(true);
        });
    });
    describe("Administrative", function () {
        it("Can increment the mint version", async function () {
            await mintproxy.newMintVersion();
            expect(await mintproxy.mintVersion()).to.equal(2);
        });
        it("Can emit MintUpdated event when incrementing the mint version", async function () {
            await expect(mintproxy.newMintVersion()).to.emit(mintproxy, "MintUpdated");
        });
        it("Cannot increment the mint version from non admin account", async function () {
            await expect(mintproxy.connect(addr1).newMintVersion()).to.be.reverted;
        });
        it("Can update the mint type", async function () {
            await mintproxy.setMintType(0);
            expect(await mintproxy.mintType()).to.equal(0);
            await mintproxy.setMintType(1);
            expect(await mintproxy.mintType()).to.equal(1);
        });
        it("Can emit MintUpdated event when updating the mint type", async function () {
            await expect(mintproxy.setMintType(0)).to.emit(mintproxy, "MintUpdated");
        });
        it("Cannot update the mint type from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).setMintType(0)).to.be.reverted;
        });
        it("Can update the mint price", async function () {
            await mintproxy.setMintPrice(1000000);
            expect(await mintproxy.mintPrice()).to.equal(1000000);
        });
        it("Can emit MintUpdated event when updating the mint price", async function () {
            await expect(mintproxy.setMintPrice(1000000)).to.emit(mintproxy, "MintUpdated");
        });
        it("Cannot update the mint price from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).setMintPrice(1000000)).to.be.reverted;
        });
        it("Can update the mint max", async function () {
            await mintproxy.setMintMax(1000000);
            expect(await mintproxy.mintMax()).to.equal(1000000);
        });
        it("Can emit MintUpdated event when updating the mint max", async function () {
            await expect(mintproxy.setMintMax(1000000)).to.emit(mintproxy, "MintUpdated");
        });
        it("Cannot update the mint max from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).setMintMax(1000000)).to.be.reverted;
        });
        it("Can activate mint", async function () {
            await mintproxy.activateMint();
            expect(await mintproxy.mintActive()).to.equal(true);
        });
        it("Can emit MintUpdated event when activating the mint", async function () {
            await expect(mintproxy.activateMint()).to.emit(mintproxy, "MintUpdated");
        });
        it("Can deactivate mint", async function () {
            await mintproxy.deactivateMint();
            expect(await mintproxy.mintActive()).to.equal(false);
        });
        it("Can emit MintUpdated event when deactivating the mint", async function () {
            await expect(mintproxy.deactivateMint()).to.emit(mintproxy, "MintUpdated");
        });
        it("Cannot activate mint from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).activateMint()).to.be.reverted;
        });
        it("Cannot deactivate mint from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).deactivateMint()).to.be.reverted;
        });
        it("Can update the target address", async function () {
            await mintproxy.setTarget(owner.address);
            expect(await mintproxy.target()).to.equal(owner.address);
        });
        it("Can emit MintUpdated event when updating the target address", async function () {
            await expect(mintproxy.setTarget(owner.address)).to.emit(mintproxy, "MintUpdated");
        });
        it("Cannot update the target address from non admin account", async function () {
            await expect(mintproxy.connect(addr1).setTarget(addr1.address)).to.be.reverted;
        });
        it("Can update signer", async function () {
            await expect(mintproxy.updateSigner(addr1.address)).to.not.be.reverted;
        });
        it("Cannot update signer from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).updateSigner(addr1.address)).to.be.reverted;
        });
    });
    describe("Minting", function () {
        it("Can public mint", async function () {
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Cannot public mint over max", async function () {
            const max = await mintproxy.mintMax();
            const mintAmount = max + 1;
            const value = mintAmount * 1000
            await expect(mintproxy.connect(addr1).publicMint(mintAmount, { value: value })).to.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
        });
        it("Can public mint multiple times up to max", async function () {
            const max = await mintproxy.mintMax();
            for(let i = 1; i <= max; i++) {
                await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.not.be.reverted;
                expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(i);
            }
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.be.reverted;
        });
        it("Cannot public mint when mintType != 0", async function () {
            await mintproxy.setMintType(1);
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.be.reverted;
        });
        it("Cannot public mint with the incorrect price", async function () {
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 500 })).to.be.reverted;
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 5000 })).to.be.reverted;
        });
        it("Cannot public mint when mint is not active", async function () {
            await mintproxy.deactivateMint();
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.be.reverted;
        });
        it("Can restricted mint", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Cannot restricted mint over assigned quantity", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 2)).to.be.reverted;
        });
        it("Can restricted mint multiple times up to assigned quantity", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 2, 1);
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 2, 1)).to.not.be.reverted;
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 2, 1)).to.not.be.reverted;
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 2, 1)).to.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(2);
        });
        it("Cannot restricted mint without a valid signature", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 2, 1)).to.be.reverted;
            await expect(mintproxy.connect(addr2).restrictedMint(signature, 1, 1)).to.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            expect(await mintproxy.mintedByAddress(addr2.address)).to.equal(0);
        });
        it("Can restricted mint with multiple valid signatures", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
            const newSignature = getSignature(ownerPrivateKey, addr1.address, 2, 1);
            await expect(mintproxy.connect(addr1).restrictedMint(newSignature, 2, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(2);
        });
        it("Cannot restricted mint when mintType != 1", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.be.reverted;
        });
        it("Cannot restricted mint with the incorrect price", async function () {
            await mintproxy.setMintType(1);
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1, { value: 500 })).to.be.reverted;
        });
        it("Cannot restricted mint when mint is not active", async function () {
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            await mintproxy.deactivateMint();
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.be.reverted;
        });
        it("Can restricted mint with price other than zero", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await mintproxy.setMintType(1);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1, { value: 1000 })).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Can admin mint", async function () {
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.adminMint(addr1.address, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Can admin mint when mintType is public", async function () {
            await mintproxy.setMintType(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.adminMint(addr1.address, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Can admin mint when mintType is restricted", async function () {
            await mintproxy.setMintType(1);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.adminMint(addr1.address, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Can admin mint when mint is not active", async function () {
            await mintproxy.deactivateMint();
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.adminMint(addr1.address, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
        });
        it("Cannot admin mint from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).adminMint(addr1.address, 1)).to.be.reverted;
        });
        it("Can create a new mint version and public mint with a reset max", async function () {
            await mintproxy.setMintMax(1);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.be.reverted;
            await mintproxy.newMintVersion();
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
            await expect(mintproxy.connect(addr1).publicMint(1, { value: 1000 })).to.be.reverted;
        });
        it("Can create a new mint version and restricted mint", async function () {
            const signature = getSignature(ownerPrivateKey, addr1.address, 1, 1);
            await mintproxy.setMintType(1);
            await mintproxy.setMintPrice(0);
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(0);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.be.reverted;
            await mintproxy.newMintVersion();
            await expect(mintproxy.connect(addr1).restrictedMint(signature, 1, 1)).to.be.reverted;
            const newSignature = getSignature(ownerPrivateKey, addr1.address, 1, 2);
            await expect(mintproxy.connect(addr1).restrictedMint(newSignature, 1, 1)).to.not.be.reverted;
            expect(await mintproxy.mintedByAddress(addr1.address)).to.equal(1);
            await expect(mintproxy.connect(addr1).restrictedMint(newSignature, 1, 1)).to.be.reverted;
        });
    });
    describe("Finance", function () {
        it("Can withdraw the contract balance", async function () {
            await mintproxy.setMintPrice('1000000000000000000')
            expect(await ethers.provider.getBalance(mintproxy.address)).to.equal(0);
            let ownerBalance = await ethers.provider.getBalance(owner.address);
            await mintproxy.publicMint(1, { value: '1000000000000000000' });
            let newOwnerBalance = await ethers.provider.getBalance(owner.address);
            expect(newOwnerBalance).to.be.below(ownerBalance);
            expect(await ethers.provider.getBalance(mintproxy.address)).to.equal('1000000000000000000');
            await mintproxy.withdraw(owner.address);
            expect(await ethers.provider.getBalance(owner.address)).to.be.above(newOwnerBalance);
            expect(await ethers.provider.getBalance(mintproxy.address)).to.equal(0);
        });
        it("Cannot withdraw from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).withdraw(addr1.address)).to.be.reverted;
        });
        it("Can update the target owner", async function () {
            await expect(mintproxy.changeTargetOwner(addr1.address)).to.not.be.reverted;
            expect(await fbomb.owner()).to.equal(addr1.address);
        });
        it("Cannot update the target owner from a non admin account", async function () {
            await expect(mintproxy.connect(addr1).changeTargetOwner(addr1.address)).to.be.reverted;
            expect(await fbomb.owner()).to.not.equal(addr1.address);
        });
    });
});

const getSignature = (pkey, address, assignedQuantity, mintVersion) => {
    const encoder = hre.ethers.utils.defaultAbiCoder;
    let messageHash = hre.ethers.utils.sha256(encoder.encode(['address', 'uint256', 'uint256'], [address, assignedQuantity, mintVersion]));
    return EthCrypto.sign(pkey, messageHash);
};
