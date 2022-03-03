window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import Vue from 'vue';
window.Vue = Vue;

import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3 from "web3";

let app = new Vue({
    el: '#app',
    data() {
        return {
            settings: {},
            connected: false,
            provider: null,
            account: null,
            chainId: null,
            mint_button_disabled: true,
            quantity: 1,
            alert: null,
            whitelist_timer: null,
            presale_timer: null,
            public_timer: null,
        }
    },
    computed: {
        canAirDrop: function() {
            if(typeof this.settings.address == 'undefined') {
                return false;
            }
            if(!this.settings.airdrop_active) {
                return false;
            }
            return this.settings.address.attributes.airdrop_quantity > 0;
        },
        whitelistCountdown: function() {
            try {
                return this.formatSeconds(this.whitelist_timer);
            } catch(error) {}
        },
        presaleCountdown: function() {
            try {
                return this.formatSeconds(this.presale_timer);
            } catch(error) {}
        },
        publicCountdown: function() {
            try {
                return this.formatSeconds(this.public_timer);
            } catch(error) {}
        },
        myCountdown: function() {
            try {
                return this.formatSeconds(this.my_timer);
            } catch(error) {}
        },
        priceInEth: function() {
            try {
                const web3 = new Web3();
                return web3.utils.fromWei(this.price, 'ether');
            } catch(error) {}
        },
        totalCost: function() {
            try {
                return this.quantity * this.priceInEth;
            } catch(error) {}
        },
        shortAccount: function() {
            try {
                return this.account.substr(0, 10) + "..." + this.account.substr(-4);
            } catch(error) {}
        },
        maxedOut: function() {
            try {
                return this.mintType == 4;
            } catch(error) {}
            return false;
        },
        showConnect: function() {
            return !this.connected;
        },
        showDisconnect: function() {
            return this.connected;
        },
        showMint: function() {
            try {
                if(!this.connected) {
                    return false;
                }
                if(this.whitelistStarted && this.mintType == 1) {
                    return true;
                }
                if(this.presaleStarted && this.mintType == 2) {
                    return true;
                }
                if(this.publicStarted && this.mintType == 3) {
                    return true;
                }
            } catch(error) {}
            return false;
        },
        mintType: function() {
            try {
                if (!this.connected) {
                    return 0;
                }
                if(this.publicStarted) {
                    return 3;
                }
                if(this.presaleStarted
                    && this.settings.address.attributes.on_presale
                    && this.settings.address.attributes.presale_hash) {
                    //&& this.settings.address.attributes.presale_minted < this.settings.presale_max_mint) {
                    return 2;
                }
            } catch(error) {}
            return 0;
        },
        mintRemaining: function() {
            switch(this.mintType) {
                //case 1:
                    //return this.settings.whitelist_max_mint - this.settings.address.attributes.whitelist_minted;
                    //break;
                case 2:
                    return this.settings.presale_max_mint;
                    //return this.settings.presale_max_mint - this.settings.address.attributes.presale_minted;
                    break;
                case 3:
                    return this.settings.public_max_mint;
                    //return this.settings.public_max_mint - this.settings.address.attributes.public_minted;
                    break;
            }
            return 0;
        },
        mintAmountDisplay: function() {
            let remaining = this.mintRemaining;
            let type;
            switch(this.mintType) {
                case 0:
                    return '';
                    break;
                case 1:
                    type = 'Whitelist';
                    break;
                case 2:
                    type = 'Presale';
                    break;
                case 3:
                    type = 'Public';
                    break;
                case 4:
                    return 'You cannot currently mint any F-Bombs';
                    break;
            }
            return type + ' can mint up to ' + remaining + ' F-Bombs!';
            //return 'You have ' + remaining + ' ' + type + ' mints remaining!';
        },
        nextMintType: function() {
            try {
                if (!this.connected) {
                    return 0;
                }
                if (!this.whitelistStarted
                    && this.settings.address.attributes.on_whitelist
                    && this.settings.address.attributes.whitelist_minted < this.settings.whitelist_max_mint) {
                    return 1;
                }
                if (!this.presaleStarted
                    && this.settings.address.attributes.on_presale
                    && this.settings.address.attributes.presale_minted < this.settings.presale_max_mint) {
                    return 2;
                }
                if (!this.publicStarted
                    && this.settings.address.attributes.public_minted < this.settings.public_max_mint) {
                    return 3;
                }
                if (this.publicStarted) {
                    return 4;
                }
            } catch(error) {}
            return 0;
        },
        my_timer: function() {
            switch(this.nextMintType) {
                case 1:
                    return this.whitelist_timer;
                    break;
                case 2:
                    return this.presale_timer;
                    break;
                case 3:
                    return this.public_timer;
                    break;
            }
            return 0;
        },
        price: function() {
            if(this.mintType == 1) {
                return this.settings.whitelist_price;
            }
            if(this.mintType == 2) {
                return this.settings.presale_price;
            }
            if(this.mintType == 3) {
                return this.settings.public_price;
            }
        },
        showNotStarted: function() {
            try {
                return this.connected && this.mintType == 0;
            } catch(error) {}
        },
        showWhitelistSignup: function() {
            try {
                return this.connected
                    && this.settings.whitelist_signup_open
                    && !this.settings.address.attributes.on_whitelist;
            } catch(error) {}
        },
        showPresaleSignup: function() {
            try {
                return this.connected
                    && this.settings.presale_signup_open
                    && !this.showWhitelistSignup
                    && !this.settings.address.attributes.on_presale;
            } catch(error) {}
        },
        whitelistStarted: function() {
            return this.whitelist_timer < 1;
        },
        presaleStarted: function() {
            return this.presale_timer < 1;
        },
        publicStarted: function() {
            return this.public_timer < 1;
        },
    },
    async mounted() {
        await this.getSettings();
    },
    watch: {
        whitelist_timer: {
            handler(value) {
                if(value > 0) {
                    setTimeout(() => {
                        this.whitelist_timer = parseInt(this.settings.whitelist_start) - Math.floor(new Date().getTime() * .001);
                    }, 1000);
                }
            },
            immediate: true
        },
        presale_timer: {
            handler(value) {
                if(value > 0) {
                    setTimeout(() => {
                        this.presale_timer = parseInt(this.settings.presale_start) - Math.floor(new Date().getTime() * .001);
                    }, 1000);
                }
            },
            immediate: true
        },
        public_timer: {
            handler(value) {
                if(value > 0) {
                    setTimeout(() => {
                        this.public_timer = parseInt(this.settings.public_start) - Math.floor(new Date().getTime() * .001);
                    }, 1000);
                }
            },
            immediate: true
        }
    },
    methods: {
        formatSeconds(seconds) {
            var days = Math.floor(seconds / (3600 * 24));
            seconds -= days * 3600 * 24;
            var hours = Math.floor(seconds / 3600);
            seconds -= hours * 3600;
            var minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60;
            return {
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: seconds,
            }
        },
        async getSettings() {
            await axios.get('/settings?address=' + this.account).then(response => {
                this.settings = response.data;
                this.whitelist_timer = this.settings.whitelist_timer;
                this.presale_timer = this.settings.presale_timer;
                this.public_timer = this.settings.public_timer;
            });
        },
        async connectViaMetaMask() {
            this.alert = null;
            if(typeof window.ethereum == 'undefined') {
                window.location.href = 'https://metamask.app.link/dapp/mint.fbombnft.com';
                return false;
            }
            try {
                await window.ethereum.enable();
                this.provider = window.ethereum;
                const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
                if (accounts.length == 0) {
                    alert("You must have an Ethereum account to continue.");
                    return this.disconnect();
                }
                this.connected = true;
                this.account = accounts[0];
                this.chainId = parseInt(window.ethereum.networkVersion);
                if (this.chainId !== this.settings.network_version) {
                    alert("You must be connected to " + this.settings.network_name + ".");
                    return this.disconnect();
                }
                await this.getSettings();
                this.mint_button_disabled = false;
            } catch (error) {
                alert(error.message);
            }
        },
        async connectViaWalletLink() {
            this.alert = null;
            const walletlink = new WalletLink({
                appName: this.settings.name,
                appLogoUrl: 'https://mint.fbombnft.com/images/logo.png',
                darkMode: true,
            });
            this.provider = walletlink.makeWeb3Provider(
                this.settings.infura_url,
                this.settings.network_version,
            );
            try {
                await this.provider.enable().then((accounts) => {
                    this.account = accounts[0];
                })
                this.connected = true;
                this.chainId = 4;
                await this.getSettings();
                this.mint_button_disabled = false;
            } catch (error) {
                this.alert = error.message;
            }
        },
        async connectViaWalletConnect() {
            this.alert = null;
            this.provider = new WalletConnectProvider({
                infuraId: this.settings.infura_id,
            });
            try {
                await this.provider.enable();
                this.connected = true;
                this.account = this.provider.accounts[0];
                this.chainId = this.provider.chainId;
                if (this.chainId !== this.settings.network_version) {
                    this.alert = "You must be connected to " + this.settings.network_name;
                    return this.disconnect();
                }
                await this.getSettings();
                this.mint_button_disabled = false;
            } catch (error) {
                this.alert = error.message;
            }
        },
        async disconnect() {
            try {
                this.provider.close();
            } catch (error) {}
            try {
                this.provider.disconnect();
            } catch (error) {}
            this.connected = false;
            this.account = null;
            this.chainId = null;
            this.contract = null;
            this.mint_button_disabled = true;
            this.alert = null;
            this.provider = null;
            this.settings.whitelist_type = null;
        },
        async mint() {
            if(!this.showMint) {
                this.alert = "Mint is not active";
                return false;
            }
            this.alert = "Waiting for a response from wallet...";
            this.mint_button_disabled = true;
            const value = this.price * this.quantity;
            try {
                const web3 = new Web3(this.provider);
                web3.handleRevert = true;
                const abi = JSON.parse(this.settings.contract_abi);
                const contract = new web3.eth.Contract(abi, this.settings.contract_address, {gas: this.settings.gas});
                let gas;
                let result;
                switch(this.mintType) {
                    case 1:
                        gas = Math.round(await contract.methods.whitelistMint(this.settings.address.attributes.whitelist_hash, this.quantity).estimateGas({ value: value.toString(), from: this.account }) * 1.0);
                        result = await contract.methods.whitelistMint(this.settings.address.attributes.whitelist_hash, this.quantity).send({ value: value.toString(), from: this.account, gas: gas });
                        break;
                    case 2:
                        gas = Math.round(await contract.methods.presaleMint(this.settings.address.attributes.presale_hash, this.quantity).estimateGas({ value: value.toString(), from: this.account }) * 1.0);
                        result = await contract.methods.presaleMint(this.settings.address.attributes.presale_hash, this.quantity).send({ value: value.toString(), from: this.account, gas: gas });
                        break;
                    case 3:
                        gas = Math.round(await contract.methods.publicMint(this.quantity).estimateGas({ value: value.toString(), from: this.account }) * 1.0);
                        result = await contract.methods.publicMint(this.quantity).send({ value: value.toString(), from: this.account, gas: gas });
                        break;
                    case 4:
                        return false;
                        break;
                }
                alert("Success! TXID:" + result.blockHash);
                this.alert = null;
            } catch(error) {
                this.alert = error.message;
            }
            await this.getSettings();
            this.mint_button_disabled = false;
        },
        async whitelist(type) {
            if(type != 1 && type != 2) {
                this.alert = "Invalid type!";
                return false;
            }
            if(type == 1 && !this.settings.whitelist_signup_open) {
                this.alert = "Whitelist signup is closed!";
                return false;
            }
            if(type == 2 && !this.settings.presale_signup_open) {
                this.alert = "Presale signup is closed!";
                return false;
            }
            await axios.post('/whitelist', {
                address: this.account,
                type: type,
            });
            this.alert = "You have been added!";
            await this.getSettings();
        }
    }
});
