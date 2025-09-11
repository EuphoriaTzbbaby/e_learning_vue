<template>
  <el-container style="height: 100vh">
    <!-- 顶部导航栏 -->
    <el-header height="60px" class="header">
      <div class="header-left">
        <!-- 折叠按钮 -->
        <el-button link class="collapse-btn" @click="toggleCollapse">
          <el-icon>
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
        <!-- logo 点击彻底隐藏/显示侧边栏 -->
        <div class="logo" @click="toggleHidden">
          <span>cwwdka</span>
        </div>
      </div>

      <!-- 右上角用户信息 -->
      <div class="right-menu">
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-avatar :src="userAvatar" size="small" />
            <span class="username" v-if="!isCollapse && !isHidden">{{ username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
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
    <el-container>
      <!-- 侧边菜单 -->
      <transition name="aside-slide">
        <el-aside
          v-show="!isHidden"
          :width="isCollapse ? '64px' : '200px'"
          class="aside"
        >
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            :collapse="isCollapse"
            router
          >
            <el-menu-item index="/student/courseList">
              <el-icon><Reading /></el-icon>
              <span>查看课程</span>
            </el-menu-item>
            <el-menu-item index="/student/english">
              <el-icon><Notebook /></el-icon>
              <span>happy english</span>
            </el-menu-item>
            <el-menu-item index="/student/englishGame">
              <el-icon><Game /></el-icon>
              <span>english game</span>
            </el-menu-item>
            <el-menu-item index="/student/englishGamePro">
              <el-icon><Game /></el-icon>
              <span>english game Pro</span>
            </el-menu-item>
            <el-menu-item index="/student/wordle">
              <el-icon><Game /></el-icon>
              <span>wordle</span>
            </el-menu-item>
            <el-menu-item index="/xhs">
              <el-icon><Xhs /></el-icon>
              <span>小蓝书</span>
            </el-menu-item>
            <el-menu-item index="/student/review">
              <el-icon><Game /></el-icon>
              <span>复习记录</span>
            </el-menu-item>
            <el-menu-item index="/student/testDs">
              <el-icon><Game /></el-icon>
              <span>测试ds</span>
            </el-menu-item>
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
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowDown,
  Reading,
  Star,
  Setting,
  Notebook,
} from '@element-plus/icons-vue'

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
  router.push('/profile')
}
const logout = () => {
  router.push('/login')
}
onMounted(() => {
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
  padding: 0 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.logo span {
  color: #fff;
}

.collapse-btn {
  color: #fff;
  font-size: 18px;
}

/* 右上角用户信息 */
.right-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  margin: 0 6px;
  font-weight: 500;
}

/* 侧边栏 */
.aside {
  background-color: #ffffff;
  border-right: 1px solid #ebeef5;
  min-height: calc(100vh - 60px);
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease;
}

.el-menu-vertical {
  border-right: none;
  padding: 10px 0;
}

/* 菜单项样式 */
.el-menu-item {
  border-radius: 8px;
  margin: 4px 12px;
  transition: all 0.3s ease;
}

.el-menu-item:hover {
  background: linear-gradient(90deg, #ecf5ff, #e6f0fa);
  color: #409eff;
  transform: translateX(4px);
}

.el-menu-item.is-active {
  background: #409eff !important;
  color: #fff !important;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

.el-menu-item.is-active .el-icon {
  color: #fff;
}

.el-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #666;
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
</style>
