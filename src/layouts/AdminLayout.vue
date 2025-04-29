<template>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="logo">
                <span>E_learning平台</span>
            </div>
            <el-menu class="menu" router :default-active="$route.path" background-color="#2d3a4b" text-color="#ffffff"
                active-text-color="#409EFF">
                <el-menu-item index="/admin/videoList">
                    <i class="el-icon-video-camera"></i>
                    <span>视频管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/videoAlbumList">
                    <i class="el-icon-collection"></i>
                    <span>合集管理</span>
                </el-menu-item>
            </el-menu>
        </aside>
        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<script lang="ts" setup>
// import { useRoute } from 'vue-router'
</script>

<style scoped>
.admin-layout {
    display: flex;
    height: 100vh;
    background-color: #f0f2f5;
}

.sidebar {
    width: 240px;
    background-color: #2d3a4b;
    display: flex;
    flex-direction: column;
}

.logo {
    height: 60px;
    line-height: 60px;
    font-size: 18px;
    font-weight: bold;
    color: white;
    text-align: center;
    border-bottom: 1px solid #1f2b3a;
    background-color: #1f2b3a;
}

.menu {
    flex: 1;
    border-right: none;
}

.main-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}
</style>