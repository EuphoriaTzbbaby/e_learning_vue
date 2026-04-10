<template>
  <el-container style="height: 100vh">
    <!-- 顶部导航栏 -->
    <el-header height="60px" class="header">
      <div class="header-left">
        <!-- logo 点击彻底隐藏/显示侧边栏 -->
        <div class="logo" @click="toggleHidden">
          <span>cwwdka</span>
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
              <img :src="userAvatar" alt="avatar" class="avatar-img" />
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
            <el-menu-item index="/student/englishGame">
              <el-icon><Coin /></el-icon>
              <span>单词闯关</span>
            </el-menu-item>
            <el-menu-item index="/student/englishGamePro">
              <el-icon><Trophy /></el-icon>
              <span>挑战模式</span>
            </el-menu-item>
            <el-menu-item index="/student/wordle">
              <el-icon><Grid /></el-icon>
              <span>Wordle</span>
            </el-menu-item>

            <!-- AI 功能 -->
            <div class="menu-group-title" v-if="!isCollapse">AI</div>
            <el-menu-item index="/student/aiReading">
              <el-icon><ChatDotRound /></el-icon>
              <span>阅读理解</span>
            </el-menu-item>
            <el-menu-item index="/xhs">
              <el-icon><Document /></el-icon>
              <span>小蓝书</span>
            </el-menu-item>

            <!-- 复习统计 -->
            <div class="menu-group-title" v-if="!isCollapse">复习</div>
            <el-menu-item index="/student/review">
              <el-icon><DataAnalysis /></el-icon>
              <span>复习记录</span>
            </el-menu-item>
            <el-menu-item index="/student/testDs">
              <el-icon><Cpu /></el-icon>
              <span>数据结构</span>
            </el-menu-item>
            <el-menu-item index="/student/sort">
              <el-icon><Sort /></el-icon>
              <span>排序算法</span>
            </el-menu-item>

            <!-- 个人中心 -->
            <div class="menu-group-title" v-if="!isCollapse">个人</div>
            <el-menu-item index="/favorites">
              <el-icon><Star /></el-icon>
              <span>我的收藏</span>
            </el-menu-item>
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
  Star,
  Setting,
  Sunny,
  Moon,
  VideoCamera,
  Reading,
  TrendCharts,
  Coin,
  Trophy,
  Grid,
  ChatDotRound,
  Document,
  DataAnalysis,
  Cpu,
  Sort,
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
const userAvatar =
  'https://cwwdka.oss-cn-beijing.aliyuncs.com/e_learning/' + currentUser.avatar
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
  applyTheme()
  console.log(userAvatar)
})
</script>

<style scoped>
/* 顶部导航栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #409eff;
  color: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  letter-spacing: 1px;
}

.logo span {
  color: #fff;
}

.collapse-btn {
  color: #fff;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

/* 右上角功能区 */
.right-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  user-select: none;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.theme-switch:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.theme-text {
  font-size: 13px;
}

/* ========== 用户头像区域 - 胶囊毛玻璃卡片 ========== */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-trigger:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.3);
}

.user-trigger:hover .avatar-img {
  transform: scale(1.08) rotate(3deg);
}

.user-trigger:hover .avatar-wrapper {
  box-shadow:
    0 0 0 2px rgba(64, 158, 255, 0.6),
    0 0 16px rgba(64, 158, 255, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 头像容器 - 相对定位承载光晕和状态点 */
.avatar-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #409eff, #66b1ff, #79bbff);
  box-shadow:
    0 0 0 2px rgba(64, 158, 255, 0.35),
    0 0 12px rgba(64, 158, 255, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 头像图片 */
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid #fff;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 用户文字信息区 */
.user-info-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主容器 */
.main-container {
  height: calc(100vh - 60px);
}

/* 侧边栏 */
.aside {
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s ease;
  overflow: hidden;
}

.el-menu-vertical {
  border-right: none;
  padding: 8px 0;
}

/* 分组标题 */
.menu-group-title {
  padding: 16px 20px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 菜单项样式 */
.el-menu-item {
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  margin: 2px 12px;
  padding: 0 12px !important;
  transition: all 0.2s ease;
  color: #606266;
}

.el-menu-item:hover {
  background-color: #f5f7fa !important;
  color: #409eff;
}

.el-menu-item.is-active {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.el-menu-item .el-icon {
  font-size: 18px;
}

.el-menu-item.is-active .el-icon {
  color: #fff !important;
}

/* 主内容区 */
.main-content {
  padding: 20px;
  min-height: 100%;
  overflow-y: auto;
}

/* 侧边栏滑入/滑出动画 */
.aside-slide-enter-active,
.aside-slide-leave-active {
  transition: all 0.3s ease;
}
.aside-slide-enter-from,
.aside-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* 折叠时隐藏文字 */
.el-menu--collapse .el-menu-item span {
  display: none;
}

.el-menu--collapse .menu-group-title {
  display: none;
}
</style>
