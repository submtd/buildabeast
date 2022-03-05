const networkId = 4;
const networkName = 'Rinkeby';
// Bootstrap
import "bootstrap";
// Web3
import Web3 from "web3";
// Axios
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
let token = document.head.querySelector('meta[name="csrf-token"]');
if(token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

// Vue
import { createApp } from "vue";
const app = createApp({
    data() {
        return {
            notice: null,
            alert: null,
            web3: new Web3(),
            account: null,
            address: null,
            connected: false,
            loggedIn: false,
        }
    },
    computed: {
        shortAccount: function () {
            try {
                return this.account.substr(0, 6) + "..." + this.account.substr(-4);
            } catch (error) {}
        },
    },
    mounted() {
        this.ping();
    },
    methods: {
        async ping() {
            var ping = this;
            setInterval(async function () {
                if(!ping.account) {
                    return;
                }
                if(typeof ping.web3.eth == 'undefined') {
                    return;
                }
                const accounts = await ping.web3.eth.getAccounts();
                if(!accounts.length) {
                    ping.disconnect();
                }
                if(accounts[0] != ping.account) {
                    ping.disconnect();
                }
                const connectedId = await ping.web3.eth.net.getId();
                if(connectedId != networkId) {
                    ping.alert = 'Incorrect network. Please connect to ' + networkName;
                    ping.disconnect();
                }
            }, 5000);
        },
        async connect() {
            try {
                this.alert = null;
                this.notice = 'Waiting on response from wallet';
                await this.web3.currentProvider.enable();
                const accounts = await this.web3.eth.getAccounts();
                this.account = accounts[0];
                this.connected = true;
                await axios.post('/address', {
                    address: this.account,
                }).then(response => {
                    this.address = response.data.data;
                }).catch(error => {
                    console.error(error);
                });
            } catch (error) {
                this.alert = error.message;
                return false;
            }
            this.notice = null;
        },
        async login() {
            if(typeof this.address.attributes == 'undefined') {
                this.alert = 'You must connect your wallet to log in';
                return false;
            }
            this.notice = 'Waiting on response from wallet';
            const signature = await this.web3.eth.personal.sign(this.address.attributes.nonce, this.address.attributes.address, "");
            await axios.post('/login', {
                address: this.address.attributes.address,
                nonce: this.address.attributes.nonce,
                signature: signature,
            }).then(response => {
                this.loggedIn = true;
                this.address = response.data.data;
            }).catch(error => {
                console.error(error);
            });
            this.notice = null;
        },
        async disconnect() {
            try {
                this.web3.currentProvider.close();
                this.web3.currentProvider.disconnect();
            } catch (error) {}
            this.account = null;
            this.address = null;
            this.connected = false;
            this.loggedIn = false;
            if(this.loggedIn) {
                await axios.post('/logout');
            }
        }
    }
});
// Components
import Disconnect from './components/Disconnect';
app.component('disconnect', Disconnect);
import Login from './components/Login';
app.component('login', Login);
import MetaMask from './components/wallets/MetaMask';
app.component('meta-mask', MetaMask);
import WalletConnect from './components/wallets/WalletConnect';
import axios from "axios";
app.component('wallet-connect', WalletConnect);
// Mount
app.mount('#app');
