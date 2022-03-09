// Bootstrap
import "bootstrap";
// Axios
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Get Props
let networkId = document.head.querySelector('meta[name="network-id"]');
let networkName = document.head.querySelector('meta[name="network-name"]');
// Vue
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
createApp(App, {
    networkId: networkId.content,
    networkName: networkName.content,
}).use(router).mount('#app');
