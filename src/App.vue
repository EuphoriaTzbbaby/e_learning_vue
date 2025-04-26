<template>
  <div class="app">
    <Navbar />
    <router-view />
  </div>
</template>

<script lang="ts" setup>
import Navbar from './components/Navbar.vue'
</script>

<style scoped>
.app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>