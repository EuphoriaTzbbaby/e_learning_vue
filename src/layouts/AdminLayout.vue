<template>
    <div class="admin-layout">
        <!-- 顶部菜单栏 -->
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
                <el-menu-item index="/admin/comment">
                    <!-- <i class="el-icon-collection"></i> -->
                    <span>评论管理</span>
                </el-menu-item>
                <el-menu-item index="/admin/reply">
                    <!-- <i class="el-icon-collection"></i> -->
                    <span>回复管理</span>
                </el-menu-item>
                <!-- 不让它触发路由 -->
                <el-menu-item @click="openUploadDialog">
                    <el-button type="primary" link>添加文件/视频</el-button>
                </el-menu-item>
            </el-menu>
        </div>

        <!-- 主内容区域 -->
        <main class="main-content">
            <router-view />
        </main>

        <!-- 上传对话框 -->
        <el-dialog v-model="uploadVisible" title="上传视频" width="500px">
            <el-form label-position="top">
                <el-form-item label="选择目录">
                    <el-select v-model="selectedPrefix" placeholder="请选择目录">
                        <el-option v-for="folder in folders" :key="folder" :label="folder.replace('e_learning/', '')"
                            :value="folder" />
                    </el-select>
                </el-form-item>

                <el-form-item label="选择文件">
                    <el-upload class="upload-demo" :action="uploadUrl" :data="{ prefix: selectedPrefix }"
                        :before-upload="beforeUpload" :show-file-list="true" :on-success="handleUploadSuccess"
                        :disabled="!selectedPrefix">
                        <el-button type="primary" :disabled="!selectedPrefix">选择文件</el-button>
                        <div class="el-upload__tip">请先选择目录再上传</div>
                    </el-upload>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 上传相关
const uploadVisible = ref(false)
const selectedPrefix = ref('')
const uploadUrl = ref(`${import.meta.env.VITE_API_URL}/api/oss/upload`) // 使用 VITE_API_BASE_URL

// 获取 OSS 目录
const folders = ref<string[]>([])

const openUploadDialog = () => {
    console.log('open upload dialog')
    uploadVisible.value = true
}

const beforeUpload = (file: File) => {
    console.log(file)
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

// 获取目录列表
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

onMounted(() => {
    // alert("所有操作只在自己新加的内容上操作")
    fetchFolders()
})
</script>

<style scoped>
.admin-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f0f2f5;
}

.top-menu {
    width: 100%;
}

.top-menu-bar {
    height: 60px;
    line-height: 60px;
    background-color: #2d3a4b;
    color: white;
    border-radius: 0;
    padding: 0;
}

.main-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}
</style>