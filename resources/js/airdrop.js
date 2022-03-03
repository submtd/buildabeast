window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import Vue from 'vue';
window.Vue = Vue;

import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3 from "web3";

import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';
window.analytics = Analytics({
    app: 'fbomb-mint',
    plugins: [
        googleAnalytics({
            trackingId: 'UA-220632184-1'
        })
    ]
});

let aj = new Vue({
    el: '#airdrop',
    data() {
        return {
            settings: {},
            connected: false,
            account: null,
            provider: null,
            alert: null,
            quantity: 1,
            airdrop_button_disabled: false,
            success: false,
            success_message: null,
            waiting: false,
        }
    },
    computed: {
        canAirdrop: function() {
            if(!this.settings.airdrop_active) {
                return false;
            }
            return this.maxAirdrops > 0;
        },
        maxAirdrops: function() {
            if(typeof this.settings.address == 'undefined') {
                return 0;
            }
            return this.settings.address.attributes.airdrop_quantity - this.settings.address.attributes.airdrop_minted;
        },
        shortAccount: function() {
            try {
                return this.account.substr(0, 10) + "..." + this.account.substr(-4);
            } catch(error) {}
        },
    },
    async mounted() {
        await this.getSettings();
        window.analytics.page();
    },
    methods: {
        async getSettings() {
            await axios.get('/airdrop-settings?address=' + this.account).then(response => {
                this.settings = response.data;
                if(typeof this.settings.address != 'undefined') {
                    this.quantity = this.settings.address.attributes.airdrop_quantity;
                }
            }).catch(error => {
                console.error(error);
            });
        },
        async connectViaMetaMask() {
           this.alert = 'Waiting on response from wallet';
           try {
               if (typeof window.ethereum == 'undefined') {
                    window.location.href = 'https://metamask.app.link/dapp/fbombnft.com/airdrop'
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
                category: 'Airdrop',
                label: 'Connected wallet',
                value: 0
            });
            window.analytics.identify(this.account, () => {
                console.log('Identified account ' + this.account);
            });
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
                category: 'Airdrop',
                label: 'Disconnected wallet',
                value: 0
            });
        },
        async airdrop() {
            this.airdrop_button_disabled = true;
            this.alert = "Waiting for a response from the wallet. Please do not close this page or use the back button.";
            this.waiting = true;
            window.analytics.track('started_airdrop', {
                category: 'Airdrop',
                label: 'Started airdrop',
                value: 0
            });
            try {
                const web3 = new Web3(this.provider);
                web3.eth.handleRevert = true;
                const abi = JSON.parse(this.settings.airdrop_abi);
                const contract = new web3.eth.Contract(abi, this.settings.airdrop_address, { gas: this.settings.gas });
                const gas = Math.round(await contract.methods.restrictedMint(this.settings.address.attributes.airdrop_hash, this.settings.address.attributes.airdrop_quantity, this.quantity).estimateGas({ value: 0, from: this.account }) * 1.0);
                const result = await contract.methods.restrictedMint(this.settings.address.attributes.airdrop_hash, this.settings.address.attributes.airdrop_quantity, this.quantity).send({ value: 0, from: this.account, gas: gas });
                this.alert = null;
                this.success = true;
                window.analytics.track('completed_airdrop', {
                    category: 'Airdrop',
                    label: 'Completed airdrop',
                    value: 0
                });
                window.location.href = '/success?txid=' + result.transactionHash + '&type=airdrop&value=0&quantity=' + this.quantity + '&account=' + this.account;
            } catch(error) {
                this.alert = null;
                window.analytics.track('airdrop_failed', {
                    category: 'Airdrop',
                    label: error.message,
                    value: 0
                });
                alert(error.message);
                this.airdrop_button_disabled = false;
                this.waiting = false;
                return false;
            }
        }
    }
});
