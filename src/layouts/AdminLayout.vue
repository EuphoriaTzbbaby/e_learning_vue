<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside-container">
      <div class="logo-container">
        <img src="../assets/avatar.jpg" class="logo-img" alt="logo" />
        <span v-show="!isCollapse" class="logo-text">后台管理系统</span>
      </div>
      <el-menu
        :default-active="activePath"
        class="admin-menu"
        router
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>
            <span>{{ item.label }}</span>
            <el-badge 
              v-if="item.countKey && getCount(item.countKey) > 0" 
              :value="getCount(item.countKey)" 
              class="menu-badge" 
              type="danger"
            />
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="top-header">
        <div class="header-left">
          <el-icon class="toggle-icon" @click="isCollapse = !isCollapse">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteLabel">{{ currentRouteLabel }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="theme-switch" @click="toggleTheme">
            <el-icon>
              <Moon v-if="theme === 'dark'" />
              <Sunny v-else />
            </el-icon>
            <span class="theme-text">{{ theme === 'dark' ? '黑夜' : '白天' }}</span>
          </div>
          <span class="time-text">{{ nowText }}</span>
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32" src="../assets/avatar.jpg" />
              <span class="username">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="refreshAdminData">刷新数据</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { 
  Collection, 
  User, 
  VideoCamera, 
  ChatDotRound, 
  ChatLineRound, 
  Odometer,
  Reading,
  Sunny,
  Moon,
  Notebook,
  TrendCharts,
  Expand,
  Fold,
  ArrowDown,
  Setting
} from '@element-plus/icons-vue'
import videoApi from '../api/video'
import videoAlbumApi from '../api/videoAlbum'
import commentApi from '../api/comment'
import replyApi from '../api/reply'
import usersApi from '../api/users'
import englishApi from '../api/english'
import reviewLogApi from '../api/reviewLog'

type CountKey = 'video' | 'album' | 'comment' | 'reply' | 'user' | 'english' | 'reviewLog'

interface MenuItem {
  path: string
  label: string
  icon: any
  countKey?: CountKey
}

const isCollapse = ref(false)
const route = useRoute()
const router = useRouter()
const activePath = computed(() => route.path)
const nowText = ref(new Date().toLocaleString())
let timer: ReturnType<typeof setInterval> | null = null

const menuItems: MenuItem[] = [
  { path: '/admin/videoList', label: '视频管理', icon: VideoCamera, countKey: 'video' },
  { path: '/admin/courseManage', label: '合集管理', icon: Collection, countKey: 'album' },
  { path: '/admin/comment', label: '评论管理', icon: ChatDotRound, countKey: 'comment' },
  { path: '/admin/reply', label: '回复管理', icon: ChatLineRound, countKey: 'reply' },
  { path: '/admin/users', label: '用户管理', icon: User, countKey: 'user' },
  { path: '/admin/english', label: '词汇管理', icon: Reading, countKey: 'english' },
  { path: '/admin/reviewLogs', label: '复习记录', icon: Notebook, countKey: 'reviewLog' },
  { path: '/admin/reviewAnalytics', label: '复习分析', icon: TrendCharts, countKey: 'reviewLog' },
  { path: '/admin/systemConfig', label: '系统配置', icon: Setting }
]

const currentRouteLabel = computed(() => {
  if (route.path === '/admin/dashboard') return '仪表盘'
  return menuItems.find(item => item.path === route.path)?.label || ''
})

const counts = ref<Record<CountKey, number | null>>({
  video: null,
  album: null,
  comment: null,
  reply: null,
  user: null,
  english: null,
  reviewLog: null
})

const getCount = (key: CountKey) => counts.value[key] ?? 0

const fetchAdminCounts = async () => {
  try {
    const [videosRes, albumsRes, commentsRes, repliesRes, usersRes, englishRes, reviewLogsRes] = await Promise.all([
      videoApi.getAllVideos(),
      videoAlbumApi.getAllAlbums(),
      commentApi.getAllComments(),
      replyApi.getAllReplys(),
      usersApi.getAllUsers(),
      englishApi.getAllEnglish(),
      reviewLogApi.getAllReviewLogs()
    ])

    counts.value.video = Array.isArray(videosRes.data) ? videosRes.data.length : 0
    counts.value.album = Array.isArray(albumsRes.data) ? albumsRes.data.length : 0
    counts.value.comment = Array.isArray(commentsRes.data) ? commentsRes.data.length : 0
    counts.value.reply = Array.isArray(repliesRes.data) ? repliesRes.data.length : 0
    counts.value.user = Array.isArray(usersRes.data) ? usersRes.data.length : 0
    counts.value.english = Array.isArray(englishRes.data) ? englishRes.data.length : 0
    counts.value.reviewLog = Array.isArray(reviewLogsRes.data) ? reviewLogsRes.data.length : 0
  } catch (error) {
    console.error('fetch admin counts failed:', error)
  }
}

const refreshAdminData = async () => {
  await fetchAdminCounts()
  ElMessage.success('数据已刷新')
}

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

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  applyTheme()
  fetchAdminCounts()
  timer = setInterval(() => {
    nowText.value = new Date().toLocaleString()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  background-color: #f0f2f5;
}

.aside-container {
  background-color: #304156;
  transition: width 0.3s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  overflow: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: #2b2f3a;
  color: #fff;
  overflow: hidden;
}

.logo-img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.logo-text {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.admin-menu {
  border-right: none;
}

.top-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.theme-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
  user-select: none;
}

.theme-text {
  font-size: 13px;
}

.time-text {
  font-size: 14px;
  color: #909399;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main-content {
  padding: 20px;
  overflow-y: auto;
}

.menu-badge {
  margin-left: 10px;
}

/* 动画效果 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
