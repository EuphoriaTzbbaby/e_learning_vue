<template>
  <div class="app">
    <!-- <Navbar v-if="!isLoginPage" /> -->
    <router-view />
  </div>
</template>

<script lang="ts" setup>
// import { useRoute } from 'vue-router'
// import { computed } from 'vue'
// import Navbar from './components/Navbar.vue'

// const route = useRoute()

// 只在登录页隐藏 Navbar
// const isLoginPage = computed(() => route.path === '/login')
</script>

<style scoped>
.app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
