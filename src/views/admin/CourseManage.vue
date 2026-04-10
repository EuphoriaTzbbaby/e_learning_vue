<template>
  <div class="collection-manage">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">总合集数</div>
              <div class="stat-value">{{ collections.length }}</div>
            </div>
            <el-icon class="stat-icon"><Reading /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">总视频数</div>
              <div class="stat-value">{{ totalVideos }}</div>
            </div>
            <el-icon class="stat-icon" style="color: #409EFF"><VideoPlay /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">总播放量</div>
              <div class="stat-value">{{ totalViews }}</div>
            </div>
            <el-icon class="stat-icon" style="color: #67C23A"><SuccessFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">平均播放量</div>
              <div class="stat-value">{{ averageViews }}</div>
            </div>
            <el-icon class="stat-icon" style="color: #E6A23C"><UserFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容 -->
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="title">合集管理</div>
          <div class="header-actions">
            <el-button type="success" @click="exportCollections" :icon="Download">
              导出合集
            </el-button>
            <el-button type="primary" @click="openAddDialog" :icon="Plus">
              新增合集
            </el-button>
          </div>
        </div>
      </template>

      <div class="filters">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索合集标题 / 描述"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
        <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
      </div>

      <el-table 
        v-loading="loading" 
        :data="paginatedCollections" 
        border 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="封面" width="120" align="center">
          <template #default="{ row }">
            <el-image 
              style="width: 80px; height: 60px; border-radius: 4px" 
              :src="row.coverUrl" 
              fit="cover"
              :preview-src-list="[row.coverUrl]"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="合集标题" min-width="180">
          <template #default="{ row }">
            <span class="collection-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="视频数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ getVideoCount(row.id) }} 个</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="播放量" width="120" align="center" sortable :sort-method="(a: any, b: any) => getPlayCountByAlbum(a.id) - getPlayCountByAlbum(b.id)">
          <template #default="{ row }">
            <div class="play-count">
              <el-icon><VideoPlay /></el-icon>
              <span class="count-number">{{ getPlayCountByAlbum(row.id) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" sortable />
        <el-table-column label="操作" width="360" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="openAddVideoDialog(row)" :icon="VideoPlay">添加视频</el-button>
            <el-divider direction="vertical" />
            <el-button link type="primary" @click="viewVideos(row)">查看视频</el-button>
            <el-divider direction="vertical" />
            <el-button link type="info" @click="openVideoStatsDialog(row)">播放详情</el-button>
            <el-divider direction="vertical" />
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button link type="danger" @click="deleteCollection(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-if="filteredCollections.length"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredCollections.length"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑合集' : '新增合集'" width="700px">
      <el-form :model="formCollection" label-width="120px" :rules="rules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="合集标题" prop="title">
              <el-input v-model="formCollection.title" placeholder="请输入合集标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="合集描述" prop="description">
              <el-input 
                v-model="formCollection.description" 
                type="textarea" 
                :rows="4" 
                placeholder="请输入合集描述" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="封面图片URL" prop="coverUrl">
              <el-input v-model="formCollection.coverUrl" placeholder="请输入封面图片URL" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCollection" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加视频对话框 -->
    <el-dialog v-model="addVideoDialogVisible" :title="`添加视频到：${currentCollection?.title}`" width="600px">
      <el-form :model="formVideo" label-width="120px">
        <el-alert
          title="自动配置信息"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <p>• OSS目录已自动设置为：<strong>e_learning/{{ currentCollection?.title }}</strong></p>
          <p>• 排序值已自动设置为：<strong>{{ formVideo.sortOrder }}</strong></p>
          <p>• 上传视频后将自动提取标题</p>
        </el-alert>

        <el-form-item label="视频文件" required>
          <el-upload
            :action="uploadUrl"
            :data="{ prefix: formVideo.ossPrefix }"
            :before-upload="beforeVideoUpload"
            :on-success="handleVideoUploadSuccess"
            :show-file-list="true"
            :disabled="!formVideo.ossPrefix"
            accept="video/*"
          >
            <el-button type="primary" :disabled="!formVideo.ossPrefix" :icon="Upload">选择视频文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 mp4、avi、mov 等格式，最大 500MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="视频标题" required>
          <el-input v-model="formVideo.title" placeholder="上传视频后自动填充，可修改" />
        </el-form-item>

        <el-form-item label="OSS Key">
          <el-input v-model="formVideo.ossKey" placeholder="上传成功后自动生成" disabled />
        </el-form-item>

        <el-form-item label="OSS目录">
          <el-input v-model="formVideo.ossPrefix" disabled />
        </el-form-item>

        <el-form-item label="视频时长(秒)">
          <el-input-number v-model="formVideo.duration" :min="0" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="排序值">
          <el-input-number v-model="formVideo.sortOrder" :min="0" style="width: 100%;" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVideoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVideo" :loading="submittingVideo" :disabled="!formVideo.videoUrl">
          添加视频
        </el-button>
      </template>
    </el-dialog>

    <!-- 视频播放量详情对话框 -->
    <el-dialog v-model="videoStatsVisible" :title="`${currentAlbumTitle} - 视频播放量详情`" width="800px">
      <div class="video-stats-content">
        <div class="album-summary">
          <div class="summary-item">
            <span class="label">合集总播放量：</span>
            <span class="value">{{ getPlayCountByAlbum(currentAlbumId) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">视频数量：</span>
            <span class="value">{{ getVideoCount(currentAlbumId) }} 个</span>
          </div>
        </div>
        
        <el-table :data="albumVideos" style="width: 100%" border stripe max-height="400">
          <el-table-column prop="id" label="视频ID" width="80" align="center" />
          <el-table-column label="视频标题" min-width="200">
            <template #default="{ row }">
              {{ getPureTitle(row.title) }}
            </template>
          </el-table-column>
          <el-table-column label="播放量" width="120" align="center" sortable :sort-method="(a: any, b: any) => getVideoPlayCount(a.id) - getVideoPlayCount(b.id)">
            <template #default="{ row }">
              <div class="play-count">
                <el-icon><VideoPlay /></el-icon>
                <span class="count-number">{{ getVideoPlayCount(row.id) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="时长" width="100" align="center">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Reading,
  VideoPlay,
  SuccessFilled,
  UserFilled,
  Download,
  Plus,
  Search,
  Refresh,
  Picture,
  Upload
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import videoAlbumApi from '../../api/videoAlbum'
import videoApi from '../../api/video'
import userActionLogApi from '../../api/userActionLog'
import { getUploadUrl } from '../../api/oss'

interface Collection {
  id: number
  title: string
  description: string
  coverUrl: string
  createTime: string
}

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const formRef = ref()
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCollections = ref<Collection[]>([])

const collections = ref<Collection[]>([])
const videos = ref<any[]>([])
const userLogs = ref<any[]>([])

// 视频播放量详情对话框
const videoStatsVisible = ref(false)
const currentAlbumId = ref(0)
const currentAlbumTitle = ref('')
const formCollection = ref<Partial<Collection>>({
  title: '',
  description: '',
  coverUrl: '',
  createTime: ''
})

// 添加视频相关
const addVideoDialogVisible = ref(false)
const currentCollection = ref<Collection | null>(null)
const submittingVideo = ref(false)
const uploadUrl = getUploadUrl()

const formVideo = ref({
  albumId: null as number | null,
  title: '',
  ossPrefix: '',
  ossKey: '',
  videoUrl: '',
  duration: 0,
  sortOrder: 0,
  createTime: ''
})

const rules = {
  title: [{ required: true, message: '请输入合集标题', trigger: 'blur' }],
  coverUrl: [{ required: true, message: '请输入封面图片URL', trigger: 'blur' }]
}

// 统计数据
const totalVideos = computed(() => videos.value.length)

// 计算总播放量
const totalViews = computed(() => {
  return userLogs.value.filter(log => log.actionType === 'WATCH_VIDEO').length
})

// 计算平均播放量
const averageViews = computed(() => {
  if (collections.value.length === 0) return 0
  return Math.round(totalViews.value / collections.value.length)
})

// 获取合集播放量
const getPlayCountByAlbum = (albumId: number) => {
  // 获取该合集下的所有视频ID
  const albumVideos = videos.value.filter(v => v.albumId === albumId)
  const videoIds = albumVideos.map(v => v.id)
  
  // 统计这些视频的播放量
  return userLogs.value.filter(log => {
    if (log.actionType !== 'WATCH_VIDEO') return false
    // 从 actionContent 中提取视频ID
    const match = log.actionContent.match(/ID:(\d+)/)
    if (match) {
      const videoId = parseInt(match[1])
      return videoIds.includes(videoId)
    }
    return false
  }).length
}

// 获取视频播放量
const getVideoPlayCount = (videoId: number) => {
  return userLogs.value.filter(log => {
    if (log.actionType !== 'WATCH_VIDEO') return false
    // 从 actionContent 中提取视频ID
    const match = log.actionContent.match(/ID:(\d+)/)
    if (match) {
      return parseInt(match[1]) === videoId
    }
    return false
  }).length
}

// 获取当前合集的视频列表
const albumVideos = computed(() => {
  return videos.value.filter(v => v.albumId === currentAlbumId.value)
})

// 打开视频播放量详情对话框
const openVideoStatsDialog = (album: Collection) => {
  currentAlbumId.value = album.id
  currentAlbumTitle.value = album.title
  videoStatsVisible.value = true
}

// 获取纯净标题（去掉后缀）
const getPureTitle = (title: string) => {
  if (!title) return ''
  return title.slice(0, -4)
}

// 格式化时长
const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getVideoCount = (collectionId: number) => {
  return videos.value.filter(v => v.albumId === collectionId).length
}

const filteredCollections = computed(() => {
  let result = collections.value
  
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(c => 
      c.title.toLowerCase().includes(kw) || 
      (c.description && c.description.toLowerCase().includes(kw))
    )
  }
  
  return result
})

const paginatedCollections = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCollections.value.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: Collection[]) => {
  selectedCollections.value = selection
}

const openAddDialog = () => {
  isEditMode.value = false
  formCollection.value = {
    title: '',
    description: '',
    coverUrl: '',
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  dialogVisible.value = true
}

const openEditDialog = (collection: Collection) => {
  isEditMode.value = true
  formCollection.value = { ...collection }
  dialogVisible.value = true
}

const submitCollection = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEditMode.value) {
          // 更新合集
          await videoAlbumApi.updateAlbum(formCollection.value)
          ElMessage.success('合集更新成功')
        } else {
          // 新增合集
          await videoAlbumApi.addAlbum(formCollection.value)
          ElMessage.success('合集添加成功')
        }
        dialogVisible.value = false
        fetchCollections()
      } catch (error) {
        console.error('Submit collection failed:', error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const viewVideos = (collection: Collection) => {
  router.push({
    path: '/admin/videoList',
    query: { albumId: collection.id, albumTitle: collection.title }
  })
}

const deleteCollection = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该合集吗？此操作不可撤销。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await videoAlbumApi.deleteAlbum(id)
    ElMessage.success('删除成功')
    fetchCollections()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete collection failed:', error)
      ElMessage.error('删除失败')
    }
  }
}

const exportCollections = () => {
  const exportData = collections.value.map(c => ({
    '合集标题': c.title,
    '描述': c.description || '',
    '视频数量': getVideoCount(c.id),
    '创建时间': c.createTime
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '合集列表')
  XLSX.writeFile(wb, `合集数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`)
  ElMessage.success('导出成功')
}

// ========== 添加视频相关 ==========
const openAddVideoDialog = async (collection: Collection) => {
  currentCollection.value = collection
  
  // 计算当前合集下的视频数量
  const currentAlbumVideos = videos.value.filter(v => v.albumId === collection.id)
  const nextSortOrder = currentAlbumVideos.length + 1
  
  // 自动设置OSS目录为：e_learning/合集名称
  const ossPrefix = `e_learning/${collection.title}`
  
  formVideo.value = {
    albumId: collection.id,
    title: '',
    ossPrefix: ossPrefix,
    ossKey: '',
    videoUrl: '',
    duration: 0,
    sortOrder: nextSortOrder,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  addVideoDialogVisible.value = true
}

const beforeVideoUpload = (file: File) => {
  if (!formVideo.value.ossPrefix) {
    ElMessage.warning('OSS目录未设置')
    return false
  }
  
  const isVideo = file.type.startsWith('video/')
  const isLt500M = file.size / 1024 / 1024 < 500
  
  if (!isVideo) {
    ElMessage.error('只能上传视频文件！')
    return false
  }
  if (!isLt500M) {
    ElMessage.error('视频文件大小不能超过 500MB！')
    return false
  }
  
  return true
}

const handleVideoUploadSuccess = (response: any) => {
  if (response.success) {
    ElMessage.success('视频上传成功！')
    
    const ossKey = response.ossKey || response.data?.ossKey || ''
    const videoUrl = response.url || response.data?.url || ''
    
    formVideo.value.ossKey = ossKey
    formVideo.value.videoUrl = videoUrl
    
    // 自动提取视频标题
    if (ossKey && !formVideo.value.title) {
      const fileName = ossKey.split('/').pop() || ''
      const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '')
      formVideo.value.title = titleWithoutExt
    }
    
    // 确保 ossKey 格式为：e_learning/合集名称/视频标题
    if (currentCollection.value && formVideo.value.title) {
      const ext = ossKey.split('.').pop() || 'mp4'
      formVideo.value.ossKey = `e_learning/${currentCollection.value.title}/${formVideo.value.title}.${ext}`
    }
  } else {
    ElMessage.error('上传失败：' + (response.message || '未知错误'))
  }
}

const submitVideo = async () => {
  if (!formVideo.value.title || !formVideo.value.albumId || !formVideo.value.videoUrl) {
    ElMessage.warning('请填写视频标题并上传视频文件')
    return
  }
  
  submittingVideo.value = true
  try {
    await videoApi.addVideo(formVideo.value)
    ElMessage.success('视频添加成功')
    addVideoDialogVisible.value = false
    fetchVideos() // 刷新视频列表
  } catch (error) {
    console.error('Add video failed:', error)
    ElMessage.error('添加视频失败')
  } finally {
    submittingVideo.value = false
  }
}

const fetchCollections = async () => {
  loading.value = true
  try {
    const res = await videoAlbumApi.getAllAlbums()
    collections.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Fetch collections failed:', error)
    ElMessage.error('获取合集列表失败')
  } finally {
    loading.value = false
  }
}

const fetchVideos = async () => {
  try {
    const res = await videoApi.getAllVideos()
    videos.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Fetch videos failed:', error)
  }
}

const fetchUserLogs = async () => {
  try {
    const res = await userActionLogApi.getAll()
    userLogs.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Fetch user logs failed:', error)
  }
}

onMounted(() => {
  fetchCollections()
  fetchVideos()
  fetchUserLogs()
})
</script>

<style scoped>
.collection-manage {
  padding: 0;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  font-size: 48px;
  color: #409EFF;
  opacity: 0.2;
}

.main-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.collection-title {
  font-weight: 600;
  color: #303133;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 24px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.play-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #409eff;
  font-weight: bold;
}

.count-number {
  font-size: 16px;
}

.video-stats-content {
  padding: 10px 0;
}

.album-summary {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-item .label {
  font-size: 14px;
  opacity: 0.9;
}

.summary-item .value {
  font-size: 20px;
  font-weight: bold;
}
</style>
