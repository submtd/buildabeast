window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import Vue from 'vue';
window.Vue = Vue;

import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3 from "web3";

import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';
import axios from 'axios';
window.analytics = Analytics({
    app: 'fbomb-mint',
    plugins: [
        googleAnalytics({
            trackingId: 'UA-220632184-1'
        })
    ]
});

let aj = new Vue({
    el: '#mint',
    data() {
        return {
            settings: {},
            connected: false,
            account: null,
            provider: null,
            alert: null,
            mint_button_disabled: false,
            success: false,
            success_message: null,
            waiting: false,
            email: null,
            email_added: false,
        }
    },
    computed: {
        priceInEth: function() {
            try {
                const web3 = new Web3();
                return web3.utils.fromWei(this.settings.public_price, 'ether');
            } catch(error) {}
        },
        totalCost: function() {
            try {
                return this.settings.quantity * this.priceInEth;
            } catch(error) {}
        },
        shortAccount: function() {
            try {
                return this.account.substr(0, 10) + "..." + this.account.substr(-4);
            } catch(error) {}
        },
        canAirDrop: function() {
            if(typeof this.settings.address == 'undefined') {
                return false;
            }
            if(!this.settings.airdrop_active) {
                return false;
            }
            return this.settings.address.attributes.airdrop_minted < this.settings.address.attributes.airdrop_quantity;
        },
        showMailingList: function() {
            if(typeof this.settings.address == 'undefined') {
                return true;
            }
            if(!this.settings.address.attributes.email && !this.email_added) {
                return true;
            }
            return false;
        },
    },
    async mounted() {
        await this.getSettings();
        window.analytics.page();
    },
    methods: {
        async getSettings() {
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });
            let qty = params.qty;
            if (qty == null) {
                qty = 1;
            }
            await axios.get('/settings?qty=' + qty + '&address=' + this.account).then(response => {
                this.settings = response.data;
            }).catch(error => {
                console.error(error);
            });
        },
        async joinEmail() {
            await axios.post('/email', {
                email: this.email,
                address: this.account,
            }).then(response => {
                this.alert = 'You have been added to the mailing list';
                this.email_added = true;
                window.analytics.track('joined_mailing_list', {
                    category: 'Mint',
                    label: 'Joined mailing list',
                    value: 0
                });
                this.getSettings();
            }).catch(error => {
                this.alert = 'Invalid email address';
                this.email = null;
                console.log(error);
            });
        },
        async connectViaMetaMask() {
           this.alert = 'Waiting on response from wallet';
           try {
               if (typeof window.ethereum == 'undefined') {
                    window.location.href = 'https://metamask.app.link/dapp/fbombnft.com'
                    return false;
               }
               this.provider = window.ethereum;
           } catch(error) {
               this.alert = error.message;
               return false;
           }
           await this.connect();
        },
        async connectViaWalletLink() {
            this.alert = 'Waiting on response from wallet';
            try {
                const walletlink = new WalletLink({
                    appName: this.settings.name,
                    appLogoUrl: "https://fbombnft.com/images/logo.png",
                });
                this.provider = walletlink.makeWeb3Provider(
                    this.settings.infura_url,
                    this.settings.network_version
                );
            } catch(error) {
                this.alert = error.message;
                return false;
            }
            await this.connect();
        },
        async connectViaWalletConnect() {
            this.alert = 'Waiting on response from wallet';
            try {
                this.provider = new WalletConnectProvider({
                    infuraId: this.settings.infura_id,
                });
            } catch(error) {
                this.alert = error.message;
                return false;
            }
            await this.connect();
        },
        async connect() {
            try {
                await this.provider.enable();
                const web3 = new Web3(this.provider);
                const connectedId = await web3.eth.net.getId();
                if(connectedId != this.settings.network_version) {
                    this.alert = 'Incorrect network. Please connect to the Ethereum ' + this.settings.network_name;
                    return this.disconnect();
                }
                const accounts = await web3.eth.getAccounts();
                this.connected = true;
                this.account = accounts[0];
                await this.getSettings();
            } catch(error) {
                this.alert = error.message;
                return false;
            }
            this.alert = null;
            window.analytics.track('connected_wallet', {
                category: 'Mint',
                label: 'Connected wallet',
                value: 0
            });
            window.analytics.identify(this.account, () => {
                console.log('Identified account ' + this.account);
            });
            if(this.email_added) {
                this.joinEmail();
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
            this.contract = null;
            this.provider = null;
            window.analytics.track('disconnected_wallet', {
                category: 'Mint',
                label: 'Disconnected wallet',
                value: 0
            });
        },
        async mint() {
            if(parseInt(this.settings.quantity) < parseInt(this.settings.minimum_quantity)) {
                this.alert = "Quantity is too low";
                return false;
            }
            if(parseInt(this.settings.quantity) > parseInt(this.settings.public_max_mint)) {
                this.alert = "Quantity is too high";
                return false;
            }
            this.mint_button_disabled = true;
            this.alert = "Waiting for a response from the wallet. Please do not close this page or use the back button.";
            this.waiting = true;
            window.analytics.track('started_mint', {
                category: 'Mint',
                label: 'Started mint',
                value: 0
            });
            try {
                const value = this.settings.public_price * this.settings.quantity;
                const web3 = new Web3(this.provider);
                web3.eth.handleRevert = true;
                const abi = JSON.parse(this.settings.airdrop_abi);
                const contract = new web3.eth.Contract(abi, this.settings.contract_address, { gas: this.settings.gas });
                const gas = Math.round(await contract.methods.publicMint(this.settings.quantity).estimateGas({ value: value.toString(), from: this.account }) * 1.0);
                const result = await contract.methods.publicMint(this.settings.quantity).send({ value: value.toString(), from: this.account, gas: gas });
                this.alert = null;
                this.success = true;
                const goalValue = Math.floor(web3.utils.fromWei(value.toString()) * 3000);
                window.analytics.track('sale', {
                    category: 'Mint',
                    label: 'Completed mint',
                    value: goalValue,
                });
                window.location.href = '/success?txid=' + result.transactionHash + '&type=mint&value=' + this.totalCost + '&quantity=' + this.settings.quantity + '&account=' + this.account;
            } catch(error) {
                this.alert = null;
                window.analytics.track('mint_failed', {
                    category: 'Mint',
                    label: error.message,
                    value: 0
                });
                alert(error.message);
                this.mint_button_disabled = false;
                this.waiting = false;
                return false;
            }
        }
    }
});
