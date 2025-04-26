<template>
    <el-header class="navbar">
        <div class="logo">学生在线观看视频</div>
        <div class="spacer"></div>
        <el-avatar :src="avatarUrl" size="medium" class="avatar" shape="circle" />
    </el-header>
</template>

<script lang="ts" setup>

// 动态路径（Vite 专用语法）
const avatarUrl = "http://cwwdka.oss-cn-beijing.aliyuncs.com/e_learning/avatar.jpg"
</script>

<style scoped>
.navbar {
    display: flex;
    align-items: center;
    padding: 0 20px;
    background-color: #409eff;
    color: white;
    height: 60px;
}

.logo {
    font-size: 20px;
    font-weight: bold;
}

.spacer {
    flex: 1;
}

.avatar {
    cursor: pointer;
}
</style>