<template>
    <el-container style="height: 100vh">
        <!-- 顶部导航栏 -->
        <el-header height="60px" class="header">
            <div class="logo">cwwdka</div>
            <div class="right-menu">
                <el-dropdown>
                    <span class="el-dropdown-link">
                        <el-avatar :src="userAvatar" size="small" />
                        {{ username }}
                        <el-icon><arrow-down /></el-icon>
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
            <el-aside width="200px" class="aside">
                <el-menu :default-active="activeMenu" class="el-menu-vertical" router>
                    <el-menu-item index="/student/courseList">
                        <el-icon>
                            <reading />
                        </el-icon>
                        <span>查看课程</span>
                    </el-menu-item>
                    <el-menu-item index="/student/english">
                        <el-icon>
                            <notebook />
                        </el-icon>
                        <span>happy english</span>
                    </el-menu-item>
                    <el-menu-item index="/student/englishGame">
                        <el-icon>
                            <game />
                        </el-icon>
                        <span>english game</span>
                    </el-menu-item>
                    <el-menu-item index="/student/englishGamePro">
                        <el-icon>
                            <game />
                        </el-icon>
                        <span>english game Pro</span>
                    </el-menu-item>
                    <el-menu-item index="/student/wordle">
                        <el-icon>
                            <game />
                        </el-icon>
                        <span>wordle</span>
                    </el-menu-item>
                    <el-menu-item index="/xhs">
                        <el-icon>
                            <xhs />
                        </el-icon>
                        <span>小蓝书</span>
                    </el-menu-item>
                    <el-menu-item index="/student/review">
                        <el-icon>
                            <game />
                        </el-icon>
                        <span>复习记录</span>
                    </el-menu-item>
                    <el-menu-item index="/favorites">
                        <el-icon>
                            <star />
                        </el-icon>
                        <span>我的收藏</span>
                    </el-menu-item>
                    <el-menu-item index="/settings">
                        <el-icon>
                            <setting />
                        </el-icon>
                        <span>设置</span>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <!-- 主内容区 -->
            <el-main>
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown, Reading, Star, Setting, Notebook} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userAvatar = "https://cwwdka.oss-cn-beijing.aliyuncs.com/e_learning/" + currentUser.avatar
const username = currentUser.username // 通过 API 获取或登录信息

const activeMenu = ref(route.path)

const goToProfile = () => {
    router.push('/profile')
}

const logout = () => {
    // 清除token等逻辑
    router.push('/login')
}
onMounted(() => {
    console.log(userAvatar)
})
</script>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #409EFF;
    color: #fff;
    padding: 0 20px;
}

.logo {
    font-size: 18px;
    font-weight: bold;
}

.right-menu {
    display: flex;
    align-items: center;
    gap: 10px;
}

.aside {
    background-color: #f5f5f5;
}
</style>