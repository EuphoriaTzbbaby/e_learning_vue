<template>
    <div class="teacher-layout">
      <!-- 顶部导航 -->
      <el-header class="teacher-header">
        <div class="logo">教师端</div>
        <div class="right">
          <el-button type="primary" @click="uploadVisible = true">添加文件/视频</el-button>
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
  
      <!-- 上传对话框 -->
      <el-dialog v-model="uploadVisible" title="上传视频" width="500px">
        <el-form label-position="top">
          <el-form-item label="选择目录">
            <el-select v-model="selectedPrefix" placeholder="请选择目录">
              <el-option
                v-for="folder in folders"
                :key="folder"
                :label="folder.replace('e_learning/', '')"
                :value="folder"
              />
            </el-select>
          </el-form-item>
  
          <el-form-item label="选择文件">
            <el-upload
              class="upload-demo"
              :action="uploadUrl"
              :data="{ prefix: selectedPrefix }"
              :before-upload="beforeUpload"
              :show-file-list="true"
              :on-success="handleUploadSuccess"
              :disabled="!selectedPrefix"
            >
              <el-button type="primary" :disabled="!selectedPrefix">选择文件</el-button>
              <div class="el-upload__tip">请先选择目录再上传</div>
            </el-upload>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import axios from 'axios'
  import TeacherAlbumManager from '../views/class/TeacherVideoAlbumList.vue'
  import TeacherVideoManager from '../views/class/TeacherVideoList.vue'
  
  export default defineComponent({
    name: 'TeacherLayout',
    components: {
      TeacherAlbumManager,
      TeacherVideoManager
    },
    setup() {
      const activeMenu = ref('album')
      const currentComponent = ref('TeacherAlbumManager')
      const handleMenuSelect = (key: string) => {
        activeMenu.value = key
        currentComponent.value =
          key === 'album' ? 'TeacherAlbumManager' : 'TeacherVideoManager'
      }
  
      const logout = () => {
        window.location.href = '/login'
      }
  
      // 上传相关逻辑
      const uploadVisible = ref(false)
      const selectedPrefix = ref('')
      const folders = ref<string[]>([])
      const uploadUrl = ref(`${import.meta.env.VITE_API_URL}/api/oss/upload`)
  
      const fetchFolders = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/oss/folders`)
          if (response.data.success) {
            folders.value = response.data.folders
          } else {
            ElMessage.error('获取文件夹列表失败：' + response.data.message)
          }
        } catch (error) {
          ElMessage.error('获取文件夹列表失败')
          console.error(error)
        }
      }
  
      const beforeUpload = (_file: File) => {
        if (!selectedPrefix.value) {
          ElMessage.warning('请先选择目录')
          return false
        }
        return true
      }
  
      const handleUploadSuccess = (response: any) => {
        if (response.success) {
          ElMessage.success('上传成功！')
          uploadVisible.value = false
        } else {
          ElMessage.error('上传失败：' + response.message)
        }
      }
  
      onMounted(() => {
        fetchFolders()
      })
  
      return {
        activeMenu,
        currentComponent,
        handleMenuSelect,
        logout,
        uploadVisible,
        selectedPrefix,
        folders,
        uploadUrl,
        beforeUpload,
        handleUploadSuccess
      }
    }
  })
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
  