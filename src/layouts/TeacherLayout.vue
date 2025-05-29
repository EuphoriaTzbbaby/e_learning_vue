<template>
    <div class="teacher-layout">
      <!-- 顶部导航 -->
      <el-header class="teacher-header">
        <div class="logo">教师端</div>
        <div class="right">
          <el-button type="text" @click="logout">退出登录</el-button>
        </div>
      </el-header>
  
      <el-container>
        <!-- 侧边菜单栏 -->
        <el-aside width="200px" class="teacher-aside">
          <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="handleMenuSelect">
            <el-menu-item index="album">合集管理</el-menu-item>
            <el-menu-item index="video">视频管理</el-menu-item>
          </el-menu>
        </el-aside>
  
        <!-- 主内容区 -->
        <el-main>
          <component :is="currentComponent" />
        </el-main>
      </el-container>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import TeacherAlbumManager from '../views/TeacherVideoAlbumList.vue'; // 合集管理
  import TeacherVideoManager from '../views/TeacherVideoList.vue'; // 视频管理
  
  export default defineComponent({
    name: 'TeacherLayout',
    components: {
      TeacherAlbumManager,
      TeacherVideoManager
    },
    setup() {
      const activeMenu = ref('album');
      const currentComponent = ref('TeacherAlbumManager');
  
      const handleMenuSelect = (key: string) => {
        activeMenu.value = key;
        currentComponent.value =
          key === 'album' ? 'TeacherAlbumManager' : 'TeacherVideoManager';
      };
  
      const logout = () => {
        // 可加入退出逻辑
        window.location.href = '/login'; // 跳转到登录页
      };
  
      return {
        activeMenu,
        currentComponent,
        handleMenuSelect,
        logout
      };
    }
  });
  </script>
  
  <style scoped>
  .teacher-layout {
    height: 100vh;
  }
  .teacher-header {
    background-color: #409eff;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    padding: 0 20px;
  }
  .teacher-aside {
    background-color: #f4f4f5;
    height: calc(100vh - 60px);
  }
  </style>
  