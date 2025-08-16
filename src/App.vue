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
  /* 设置全局字体样式，按优先级依次使用 Avenir、Helvetica、Arial 或任意无衬线字体 */
  /* 字体族按优先级排序:
   * 1. -apple-system: macOS/iOS 系统默认字体
   * 2. BlinkMacSystemFont: Chrome在macOS上使用的系统字体
   * 3. Segoe UI: Windows系统默认字体
   * 4. Roboto: Android系统默认字体
   * 5. Helvetica Neue/Arial: 通用无衬线字体
   * 6. Noto Sans: Google开源字体,支持多语言
   * 7. sans-serif: 任意无衬线字体兜底
   * 8. Apple Color Emoji: emoji表情字体
   */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji';
}
</style>
