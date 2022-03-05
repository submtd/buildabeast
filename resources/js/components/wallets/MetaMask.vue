<template>
    <div class="meta-mask">
        <button @click="connect" class="btn btn-link"><slot></slot></button>
    </div>
</template>

<script>
    export default {
        methods: {
            connect() {
                this.$parent.wallet = 'meta-mask';
                try {
                    if (typeof window.ethereum == 'undefined') {
                        window.location.href = 'https://metamask.app.link/dapp/' + location.hostname;
                        return false;
                    }
                    this.$parent.web3.setProvider(window.ethereum);
                } catch (error) {
                    this.$parent.alert = error.message;
                    return false;
                }
                this.$parent.connect();
            }
        }
    }
</script>
