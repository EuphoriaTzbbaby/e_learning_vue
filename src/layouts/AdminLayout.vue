<template>
    <div class="admin-layout">
        <!-- 顶部菜单栏（左侧菜单移到顶部） -->
        <div class="top-menu">
            <el-menu class="top-menu-bar" router :default-active="$route.path" background-color="#2d3a4b"
                text-color="#ffffff" active-text-color="#409EFF" mode="horizontal">
                <el-menu-item index="/admin/videoList">
                    <i class="el-icon-video-camera"></i>
                    <span>视频管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/videoAlbumList">
                    <i class="el-icon-collection"></i>
                    <span>合集管理</span>
                </el-menu-item>
            </el-menu>
        </div>

        <!-- 主内容区域 -->
        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<script lang="ts" setup>
// script 部分可以根据需要添加
</script>

<style scoped>
.admin-layout {
    display: flex;
    flex-direction: column;
    /* 垂直排列，顶部菜单和主内容 */
    height: 100vh;
    background-color: #f0f2f5;
}

/* 顶部菜单栏样式 */
.top-menu {
    width: 100%;
}

.top-menu-bar {
    height: 60px;
    line-height: 60px;
    /* 垂直居中菜单项 */
    background-color: #2d3a4b;
    text-color: white;
    border-radius: 4px;
    padding: 0;
}

/* 主内容区域样式 */
.main-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}
</style>
