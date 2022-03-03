import Vue from 'vue';
window.Vue = Vue;

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

let app = new Vue({
    el: '#app',
    mounted() {
        window.analytics.page();
    }
});
