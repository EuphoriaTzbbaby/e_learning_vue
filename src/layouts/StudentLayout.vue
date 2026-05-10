<template>
  <el-container style="height: 100vh">
    <!-- 顶部导航栏 -->
    <el-header height="60px" class="header">
      <div class="header-left">
        <!-- logo 点击彻底隐藏/显示侧边栏 -->
        <div class="logo" @click="toggleHidden">
          <span>E-Learning</span>
        </div>
      </div>

      <!-- 右上角功能区 -->
      <div class="right-menu">
        <!-- 折叠按钮 -->
        <el-button link class="collapse-btn" @click="toggleCollapse">
          <el-icon>
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
        <!-- 主题切换 -->
        <div class="theme-switch" @click="toggleTheme">
          <el-icon>
            <Moon v-if="theme === 'dark'" />
            <Sunny v-else />
          </el-icon>
        </div>
        <!-- 用户下拉 - hover 触发 -->
        <el-dropdown trigger="hover">
          <div class="user-trigger">
            <div class="avatar-wrapper">
              <div class="user-id-avatar">{{ userId }}</div>
            </div>
            <div class="user-info-text">
              <span class="username">{{ username }}</span>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfile">个人信息</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 主体部分 -->
    <el-container class="main-container">
      <!-- 侧边菜单 -->
      <transition name="aside-slide">
        <el-aside
          v-show="!isHidden"
          :width="isCollapse ? '64px' : '220px'"
          class="aside"
        >
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            :collapse="isCollapse"
            router
          >
            <!-- 学习相关 -->
            <div class="menu-group-title" v-if="!isCollapse">学习</div>
            <el-menu-item index="/student/courseList">
              <el-icon><VideoCamera /></el-icon>
              <span>课程中心</span>
            </el-menu-item>
            <el-menu-item index="/student/english">
              <el-icon><Reading /></el-icon>
              <span>词汇学习</span>
            </el-menu-item>
            <el-menu-item index="/student/englishWordFreq">
              <el-icon><TrendCharts /></el-icon>
              <span>高频词汇</span>
            </el-menu-item>

            <!-- 游戏娱乐 -->
            <div class="menu-group-title" v-if="!isCollapse">娱乐</div>
            <!-- <el-menu-item index="/student/englishGame">
              <el-icon><Coin /></el-icon>
              <span>单词闯关</span>
            </el-menu-item> -->
            <el-menu-item index="/student/englishGamePro">
              <el-icon><Trophy /></el-icon>
              <span>记忆词汇</span>
            </el-menu-item>
            <el-menu-item index="/student/wordle">
              <el-icon><Grid /></el-icon>
              <span>猜单词游戏</span>
            </el-menu-item>

            <!-- AI 功能 -->
            <div class="menu-group-title" v-if="!isCollapse">AI</div>
            <el-menu-item index="/student/aiReading">
              <el-icon><ChatDotRound /></el-icon>
              <span>阅读理解</span>
            </el-menu-item>
            <!-- <el-menu-item index="/xhs">
              <el-icon><Document /></el-icon>
              <span>小蓝书</span>
            </el-menu-item> -->

            <!-- 复习统计 -->
            <div class="menu-group-title" v-if="!isCollapse">复习</div>
            <el-menu-item index="/student/review">
              <el-icon><DataAnalysis /></el-icon>
              <span>复习记录</span>
            </el-menu-item>
            <!-- <el-menu-item index="/student/testDs">
              <el-icon><Cpu /></el-icon>
              <span>数据结构</span>
            </el-menu-item>
            <el-menu-item index="/student/sort">
              <el-icon><Sort /></el-icon>
              <span>排序算法</span>
            </el-menu-item> -->

            <!-- 个人中心 -->
            <div class="menu-group-title" v-if="!isCollapse">个人</div>
            <!-- <el-menu-item index="/favorites">
              <el-icon><Star /></el-icon>
              <span>我的收藏</span>
            </el-menu-item> -->
            <el-menu-item index="/settings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
      </transition>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Setting,
  Sunny,
  Moon,
  VideoCamera,
  Reading,
  TrendCharts,
  // Coin,
  Trophy,
  Grid,
  ChatDotRound,
  DataAnalysis,
} from '@element-plus/icons-vue'

type ThemeMode = 'light' | 'dark'

const getChinaHour = () => {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    hour12: false
  }).formatToParts(new Date())
  const h = parts.find((p) => p.type === 'hour')?.value
  const n = h ? Number(h) : NaN
  return Number.isFinite(n) ? n : new Date().getHours()
}

const getDefaultThemeByChinaTime = (): ThemeMode => {
  const h = getChinaHour()
  return h >= 7 && h < 19 ? 'light' : 'dark'
}

const savedTheme = localStorage.getItem('theme')
const theme = ref<ThemeMode>(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : getDefaultThemeByChinaTime())

const applyTheme = () => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  localStorage.setItem('theme', theme.value)
}

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme()
}

const router = useRouter()
const route = useRoute()
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser.id || '?'
const username = currentUser.username

const activeMenu = ref(route.path)
const isCollapse = ref(false) // 折叠
const isHidden = ref(false)   // 完全隐藏

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const toggleHidden = () => {
  isHidden.value = !isHidden.value
}

const goToProfile = () => {
  router.push('/student/profile')
}
const logout = () => {
  router.push('/login')
}
onMounted(() => {
  console.log(userId, 99999)
  applyTheme()
})
</script>

<style scoped>
/* ========== 顶部导航栏 ========== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 0 24px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 22px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.logo span {
  color: #fff;
  background: linear-gradient(90deg, #fff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.collapse-btn {
  color: #fff;
  font-size: 20px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* 右上角功能区 */
.right-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  user-select: none;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.3s ease;
  font-size: 18px;
}

.theme-switch:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: rotate(15deg);
}

/* ========== 用户头像区域 ========== */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-trigger:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.user-trigger:hover .avatar-wrapper {
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.4),
    0 0 20px rgba(255, 255, 255, 0.3),
    0 4px 15px rgba(0, 0, 0, 0.2);
}

.avatar-wrapper {
  position: relative;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.3),
    0 2px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.user-id-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  overflow: hidden;
}

.user-trigger:hover .user-id-avatar {
  transform: scale(1.08);
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
}

.user-info-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* ========== 主容器 ========== */
.main-container {
  height: calc(100vh - 60px);
}

/* ========== 侧边栏美化 ========== */
.aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-right: none;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

/* 侧边栏顶部装饰线 */
.aside::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* 侧边栏底部装饰 */
.aside::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: radial-gradient(ellipse at bottom, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.el-menu-vertical {
  border-right: none;
  padding: 16px 0;
  background: transparent !important;
}

/* ========== 分组标题美化 ========== */
.menu-group-title {
  padding: 20px 24px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-group-title::before {
  content: '';
  width: 16px;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* ========== 菜单项美化 ========== */
.el-menu-item {
  height: 48px;
  line-height: 48px;
  border-radius: 12px;
  margin: 4px 14px;
  padding: 0 16px !important;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

/* 菜单项背景动效 */
.el-menu-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.4s ease;
}

.el-menu-item:hover::before {
  width: 200px;
  height: 200px;
}

.el-menu-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #fff !important;
  transform: translateX(4px);
}

.el-menu-item .el-icon {
  font-size: 20px;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.el-menu-item:hover .el-icon {
  transform: scale(1.15);
  color: #667eea;
}

/* 激活状态 */
.el-menu-item.is-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%) !important;
  color: #fff !important;
  box-shadow:
    0 4px 15px rgba(102, 126, 234, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  font-weight: 600;
  transform: translateX(4px);
}

.el-menu-item.is-active::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid rgba(255, 255, 255, 0.3);
}

.el-menu-item.is-active .el-icon {
  color: #fff !important;
  transform: scale(1.1);
}

/* ========== 主内容区 ========== */
.main-content {
  padding: 24px;
  min-height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
}

/* ========== 动画效果 ========== */
.aside-slide-enter-active,
.aside-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.aside-slide-enter-from,
.aside-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* 折叠时样式 */
.el-menu--collapse .el-menu-item {
  margin: 4px 8px;
  padding: 0 12px !important;
  justify-content: center;
}

.el-menu--collapse .el-menu-item span {
  display: none;
}

.el-menu--collapse .el-menu-item .el-icon {
  margin-right: 0;
}

.el-menu--collapse .menu-group-title {
  display: none;
}

/* 滚动条美化 */
.aside::-webkit-scrollbar {
  width: 6px;
}

.aside::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.aside::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.aside::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

/* ========== 深色模式适配 ========== */
:deep(.dark) .main-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

:deep(.dark) .el-menu-item {
  color: rgba(255, 255, 255, 0.65);
}

:deep(.dark) .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
</style>
