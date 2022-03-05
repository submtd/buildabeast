// Bootstrap
import "bootstrap";
// Axios
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
let token = document.head.querySelector('meta[name="csrf-token"]');
if(token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}
// Vue
import { createApp } from "vue";

// App Specific Stuff
import App from "./app";
const app = createApp(App);
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
