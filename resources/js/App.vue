<template>
    <!-- BEGIN NAVIGATION -->
    <nav class="navbar navbar-expand-sm navbar-dark bg-dark">
        <div class="container-fluid">
            <router-link :to="{ name: 'Home' }" class="navbar-brand">Brand</router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbar">
                <!-- BEGIN PRIMARY NAVIGATION -->
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <router-link :to="{ name: 'Home' }" class="nav-link" active-class="active">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link :to="{ name: 'About' }" class="nav-link" active-class="active">About</router-link>
                    </li>
                </ul>
                <!-- END PRIMARY NAVIGATION -->
                <div class="d-flex">
                    <!-- BEGIN SECONDARY NAVIGATION -->
                    <!--<ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="#">Secondary item</a>
                        </li>
                    </ul>-->
                    <!-- END SECONDARY NAVIGATION -->
                    <!-- BEGIN WALLET BUTTONS -->
                    <button v-show="!connected" class="btn btn-sm btn-primary mx-1" data-bs-toggle="modal" data-bs-target="#connect">Connect Wallet</button>
                    <button v-show="connected && !loggedIn" @click="login" class="btn btn-sm btn-primary mx-1">Login</button>
                    <button v-show="connected" @click="disconnect" class="btn btn-sm btn-danger mx-1">Disconnect {{ shortAccount }}</button>
                    <!-- END WALLET BUTTONS -->
                </div>
            </div>
        </div>
    </nav>
    <!-- END NAVIGATION -->

    <!-- BEGIN NOTICES -->
    <div v-show="notice" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ notice }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    <div v-show="alert" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ alert }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    <!-- END NOTICES -->

    <!-- BEGIN PAGE CONTENT -->
    <div class="container mt-5 mb-5">
        <router-view/>
    </div>
    <!-- END PAGE CONTENT -->

    <!-- BEGIN FOOTER CONTENT -->

    <!-- END FOOTER CONTENT -->

    <!-- BEGIN CONNECT WALLET MODAL -->
    <div class="modal fade" id="connect" tabindex="-1" aria-labelledby="connectLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Connect Wallet</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md text-center">
                            <meta-mask type="button" data-bs-dismiss="modal" ref="meta-mask">
                                <img class="img-fluid" src="/images/metamask.svg" alt="metamask">
                            </meta-mask>
                        </div>
                        <div class="col-md text-center">
                            <wallet-connect type="button" data-bs-dismiss="modal" rpc="" ref="wallet-connect">
                                <img class="img-fluid" src="/images/walletconnect.svg" alt="walletconnect">
                            </wallet-connect>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END CONNECT WALLET MODAL -->
</template>

<script>
    import Disconnect from "./components/Disconnect.vue";
    import Login from "./components/Login.vue";
    import MetaMask from "./components/wallets/MetaMask.vue";
    import WalletConnect from "./components/wallets/WalletConnect.vue";
    import Web3 from "web3";
    export default {
        components: {
            'disconnect': Disconnect,
            'login': Login,
            'meta-mask': MetaMask,
            'wallet-connect': WalletConnect,
        },
        props: [
            'networkId',
            'networkName',
        ],
        data() {
            return {
                notice: null,
                alert: null,
                wallet: null,
                web3: new Web3(),
                account: null,
                address: null,
                connected: false,
                loggedIn: false,
            }
        },
        computed: {
            shortAccount: function () {
                if(!this.account) {
                    return null;
                }
                return this.account.substr(0, 6) + "..." + this.account.substr(-4);
            }
        },
        mounted() {
            this.getSession();
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
                    if(connectedId != ping.networkId) {
                        ping.alert = 'Incorrect network. Please connect to ' + ping.networkName;
                        ping.disconnect();
                    }
                }, 1000);
            },
            async getSession() {
                await axios.get('/api/v1/session').then(response => {
                    this.wallet = response.data.wallet;
                    if(typeof this.wallet != 'undefined') {
                        this.$refs[this.wallet].connect();
                    }
                    this.account = response.data.account;
                    this.address = response.data.address;
                    this.connected = response.data.connected;
                    this.loggedIn = response.data.loggedIn;
                }).catch(error => {});
            },
            async updateSession() {
                await axios.post('/api/v1/session', {
                    wallet: this.wallet,
                    account: this.account,
                    address: this.address,
                    connected: this.connected,
                    loggedIn: this.loggedIn,
                }).then(response => {
                }).catch(error => {
                });
            },
            async connect() {
                try {
                    this.alert = null;
                    await this.web3.currentProvider.enable();
                    const accounts = await this.web3.eth.getAccounts();
                    this.account = accounts[0];
                    this.connected = true;
                    await axios.post('/api/v1/address', {
                        address: this.account,
                    }).then(response => {
                        this.address = response.data.data;
                    }).catch(error => {});
                    this.updateSession();
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
                await axios.post('/api/v1/login', {
                    address: this.address.attributes.address,
                    nonce: this.address.attributes.nonce,
                    signature: signature,
                }).then(response => {
                    this.loggedIn = true;
                    this.address = response.data.data;
                }).catch(error => {});
                this.updateSession();
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
                await axios.post('/api/v1/logout');
            }
        }
    }
</script>
