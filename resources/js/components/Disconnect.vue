<template>
    <button @click="disconnect" :class="class"><slot></slot> {{ this.$parent.shortAccount }}</button>
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
            disconnect() {
                this.$parent.disconnect();
            }
        }
    }
</script>
