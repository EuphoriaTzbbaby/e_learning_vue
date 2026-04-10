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

html,
body {
  margin: 0;
  background-color: #f0f2f5;
}

html.dark,
html.dark body {
  background-color: #0f172a;
  color: #e5e7eb;
}

html.dark .admin-layout {
  background-color: #0f172a;
}

html.dark .top-header {
  background-color: #111827;
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

html.dark .header {
  background-color: #1d283a !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

html.dark .aside {
  background-color: #1d283a !important;
  border-right-color: rgba(255, 255, 255, 0.1);
}

html.dark .logo span {
  color: #e5e7eb;
}

html.dark .collapse-btn {
  color: #e5e7eb !important;
}

html.dark .el-menu-vertical {
  background-color: transparent !important;
}

html.dark .el-menu-item {
  background-color: transparent !important;
  color: #e5e7eb !important;
}

html.dark .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #409eff !important;
}

html.dark .el-menu-item.is-active {
  background-color: #409eff !important;
  color: #fff !important;
}

html.dark .el-menu-item .el-icon {
  color: #e5e7eb !important;
}

html.dark .el-menu-item.is-active .el-icon {
  color: #fff !important;
}

html.dark .main-content {
  background-color: transparent !important;
}

html.dark .menu-group-title {
  color: #6b7280 !important;
}

html.dark .user-trigger {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

html.dark .user-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

html.dark .avatar-wrapper {
  box-shadow:
    0 0 0 2px rgba(64, 158, 255, 0.4),
    0 0 10px rgba(64, 158, 255, 0.25),
    0 2px 6px rgba(0, 0, 0, 0.3);
}

html.dark .avatar-img {
  border-color: #1d283a;
}

html.dark .username {
  color: #e5e7eb;
}

html.dark .arrow-icon {
  color: rgba(255, 255, 255, 0.6);
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
