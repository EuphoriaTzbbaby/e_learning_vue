<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- 全局宠物组件 -->
    <GlobalChat />
    
    <!-- 主内容区域 -->
    <router-view />
    
    <!-- 或者您的现有布局 -->
    <!-- <div class="main-content">
      <header>您的头部</header>
      <main>您的内容</main>
      <footer>您的底部</footer>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import GlobalChat from './components/cwwChat.vue'
// import { provide } from 'vue'

// 如果需要从子组件控制宠物，可以提供一个全局方法
// provide('petControl', {
//   showMessage: (message: string) => {
//     // 这里可以通过ref获取宠物实例并调用方法
//   }
// })
</script>

<style>
#app {
  position: relative;
  min-height: 100vh;
}

/* 确保宠物在所有内容之上 */
.global-pet {
  z-index: 9999;
}
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
