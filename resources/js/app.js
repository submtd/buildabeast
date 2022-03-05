const networkId = 4;
const networkName = 'Rinkeby';
// Web3
import Web3 from "web3";
// App
export default {
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
            try {
                return this.account.substr(0, 6) + "..." + this.account.substr(-4);
            } catch (error) {}
        },
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
                if(connectedId != networkId) {
                    ping.alert = 'Incorrect network. Please connect to ' + networkName;
                    ping.disconnect();
                }
            }, 5000);
        },
        async getSession() {
            await axios.get('/session').then(response => {
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
            await axios.post('/session', {
                wallet: this.wallet,
                account: this.account,
                address: this.address,
                connected: this.connected,
                loggedIn: this.loggedIn,
            }).then(response => {
                console.log(response.data);
            }).catch(error => {});
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
            await axios.post('/login', {
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
            if(this.loggedIn) {
                await axios.post('/logout');
            }
        }
    }
}
