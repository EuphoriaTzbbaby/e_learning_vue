<template>
    <el-header class="navbar">
        <div class="logo">学生在线观看视频</div>
        <div class="spacer"></div>
        <div class="user-id-avatar">{{ displayName }}</div>
    </el-header>
</template>

<script lang="ts" setup>
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser.id || '?'
const userName = currentUser.username || currentUser.email || userId
// 截取名字的前两个字符显示
const displayName = userName.length > 2 ? userName.substring(0, 2) : userName
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

.user-id-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #409eff;
    cursor: pointer;
    box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.3),
        0 2px 10px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.user-id-avatar:hover {
    transform: scale(1.08);
}
</style>