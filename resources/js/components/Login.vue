<template>
    <button @click="login" :class="class"><slot></slot></button>
</template>

<script>
    export default {
        props: {
            class: {
                type: String,
                default: 'btn btn-lg btn-primary',
            },
        },
        methods: {
            login() {
                this.$parent.login();
            }
        }
    }
</script>
