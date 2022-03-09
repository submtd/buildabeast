// Get Props
let tagManagerContainerId = document.head.querySelector('meta[name="tag-manager-container-id"]');
let networkId = document.head.querySelector('meta[name="network-id"]');
let networkName = document.head.querySelector('meta[name="network-name"]');
// Bootstrap
import "bootstrap";
// Axios
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Tag Manager
import Analytics from "analytics";
import googleTagManager from "@analytics/google-tag-manager";
window.analytics = Analytics({
    app: location.hostname,
    plugins: [
        googleTagManager({
            containerId: tagManagerContainerId.content,
        }),
    ],
});
// Vue
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
createApp(App, {
    networkId: networkId.content,
    networkName: networkName.content,
}).use(router).mount('#app');
