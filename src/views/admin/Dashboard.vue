<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-title">{{ card.title }}</div>
              <div class="stat-value">{{ card.value }}</div>
            </div>
            <el-icon class="stat-icon" :style="{ color: card.color }">
              <component :is="card.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 用户增长趋势 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">用户增长趋势</span>
              <el-radio-group v-model="userGrowthPeriod" size="small">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="userGrowthChartRef" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 课程访问量 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">课程访问量统计</span>
              <el-button type="primary" link @click="exportChartData('visit')">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </template>
          <div ref="visitChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 用户占比 -->
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">用户角色分布</span>
          </template>
          <div v-if="roleTotal > 0" ref="pieChartRef" class="chart-box"></div>
          <el-empty v-else description="暂无用户数据" />
        </el-card>
      </el-col>

      <!-- 最近活动 -->
      <el-col :span="16">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近活动</span>
              <!-- <el-button text @click="loadMoreActivities">
                <el-icon><More /></el-icon>
                查看更多
              </el-button> -->
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
              :type="activity.type"
              placement="top"
            >
              <div class="activity-content">
                <!-- <el-icon class="activity-icon">
                  <component :is="activity.icon" />
                </el-icon> -->
                <span>{{ activity.content  }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="recentActivities.length === 0" description="暂无活动记录" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出报表" width="500px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="报表类型">
          <el-checkbox-group v-model="exportForm.types">
            <el-checkbox label="users">用户数据</el-checkbox>
            <el-checkbox label="vocabulary">词汇数据</el-checkbox>
            <el-checkbox label="courses">课程数据</el-checkbox>
            <el-checkbox label="reviews">复习记录</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="xlsx">Excel</el-radio>
            <el-radio label="csv">CSV</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exporting">
          确认导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
// import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import {
  User,
  VideoCamera,
  VideoPlay,
  ChatDotRound,
  Reading,
  Download,
  // More,
  Star,
  Document
} from '@element-plus/icons-vue'
import videoApi from '../../api/video'
import videoAlbumApi from '../../api/videoAlbum'
import commentApi from '../../api/comment'
import usersApi from '../../api/users'
import englishApi from '../../api/english'
import userActionLogApi from '../../api/userActionLog'

// const router = useRouter()

// 图表引用
const userGrowthChartRef = ref<HTMLElement | null>(null)
const visitChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)

let userGrowthChart: echarts.ECharts | null = null
let visitChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const userGrowthPeriod = ref('week')
const exportDialogVisible = ref(false)
const exporting = ref(false)

const exportForm = ref({
  types: ['users', 'vocabulary'],
  dateRange: [],
  format: 'xlsx'
})

// 统计卡片
const statCards = ref([
  { title: '总用户数', value: '0', icon: User, color: '#409EFF' },
  { title: '视频总数', value: '0', icon: VideoCamera, color: '#67C23A' },
  { title: '词汇总数', value: '0', icon: Reading, color: '#E6A23C' },
  { title: '总评论数', value: '0', icon: ChatDotRound, color: '#F56C6C' }
])

const roleCounts = ref({ student: 0, teacher: 0, admin: 0, other: 0 })
const roleTotal = computed(() => {
  return roleCounts.value.student + roleCounts.value.teacher + roleCounts.value.admin + roleCounts.value.other
})

// 最近活动数据
const recentActivities = ref<any[]>([])

/**
 * 格式化时间为相对时间
 */
const formatRelativeTime = (timeStr: string): string => {
  if (!timeStr) return '未知时间'
  
  try {
    const time = new Date(timeStr.replace(/-/g, '/'))
    const now = new Date()
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return timeStr
  } catch {
    return timeStr
  }
}

/**
 * 根据 actionType 获取活动类型和图标
 */
const getActivityConfig = (actionType: string) => {
  const config: Record<string, { type: string; icon: any }> = {
    WATCH_VIDEO: { type: 'primary', icon: VideoPlay },
    LOGIN: { type: 'success', icon: User },
    LOGOUT: { type: 'info', icon: User },
    LIKE: { type: 'warning', icon: Star },
    FAVORITE: { type: 'warning', icon: Star },
    COMMENT: { type: 'info', icon: ChatDotRound },
    REGISTER: { type: 'success', icon: User },
  }
  
  return config[actionType] || { type: '', icon: Document }
}

// 获取数据
const fetchData = async () => {
  try {
    const [videosRes, _albumsRes, commentsRes, usersRes, englishRes, logsRes] = await Promise.all([
      videoApi.getAllVideos(),
      videoAlbumApi.getAllAlbums(),
      commentApi.getAllComments(),
      usersApi.getAllUsers(),
      englishApi.getAllEnglish(),
      userActionLogApi.getAll()  // 获取所有活动日志
    ])

    const users = Array.isArray(usersRes.data) ? usersRes.data : []
    const videos = Array.isArray(videosRes.data) ? videosRes.data : []
    const english = Array.isArray(englishRes.data) ? englishRes.data : []
    const comments = Array.isArray(commentsRes.data) ? commentsRes.data : []
    
    statCards.value[0].value = users.length.toString()
    statCards.value[1].value = videos.length.toString()
    statCards.value[2].value = english.length.toString()
    statCards.value[3].value = comments.length.toString()

    const nextRoleCounts = { student: 0, teacher: 0, admin: 0, other: 0 }
    for (const u of users) {
      const role = typeof u?.role === 'string' ? u.role : ''
      if (role === 'student') nextRoleCounts.student += 1
      else if (role === 'teacher') nextRoleCounts.teacher += 1
      else if (role === 'admin') nextRoleCounts.admin += 1
      else nextRoleCounts.other += 1
    }
    roleCounts.value = nextRoleCounts

    // 处理最近活动数据
    if (Array.isArray(logsRes.data)) {
      // 按时间倒序排序，取最近10条
      const sortedLogs = logsRes.data
        .sort((a: any, b: any) => {
          const timeA = new Date(a.actionTime || 0).getTime()
          const timeB = new Date(b.actionTime || 0).getTime()
          return timeB - timeA
        })
        .slice(0, 10)

      // 格式化活动内容，去除ID显示
      const formatActivityContent = (content: string) => {
        if (!content) return ''
        // 处理"观看了视频【ID:53，标题:变化中的英语】"格式
        const videoMatch = content.match(/观看了视频【ID:\d+，标题:(.+)】/)
        if (videoMatch) {
          return `观看了${videoMatch[1]}`
        }
        return content
      }

      // 转换为活动列表格式
      recentActivities.value = sortedLogs.map((log: any) => {
        const config = getActivityConfig(log.actionType)
        return {
          content: formatActivityContent(log.actionContent) || `${log.actionType} 操作`,
          time: formatRelativeTime(log.actionTime),
          type: config.type,
          icon: config.icon
        }
      })
    }
  } catch (error) {
    console.error('Fetch dashboard data failed:', error)
  }
}

// 初始化用户增长图表
const initUserGrowthChart = async () => {
  await nextTick()
  if (userGrowthChartRef.value) {
    userGrowthChart = echarts.init(userGrowthChartRef.value)

    try {
      // 获取所有用户数据
      const usersRes = await usersApi.getAllUsers()
      const users = Array.isArray(usersRes.data) ? usersRes.data : []

      // 计算天数
      const days = userGrowthPeriod.value === 'week' ? 7 : 30
      const dates: string[] = []
      const newUsers: number[] = []
      const totalUsers: number[] = []

      // 生成日期列表
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
      }

      // 统计每天新增用户数
      const dateCountMap: Record<string, number> = {}
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
        dateCountMap[dateStr] = 0
      }

      // 遍历用户数据，统计每个日期的新增用户
      users.forEach((user: any) => {
        if (user.createdAt || user.create_ed) {
          const createdAt = user.createdAt || user.create_ed
          const dateStr = createdAt.split(' ')[0] || createdAt.split('T')[0]
          if (dateCountMap.hasOwnProperty(dateStr)) {
            dateCountMap[dateStr]++
          }
        }
      })

      // 构建数据数组
      let cumulative = 0
      const sortedDates = Object.keys(dateCountMap).sort()
      sortedDates.forEach(dateStr => {
        const newCount = dateCountMap[dateStr]
        newUsers.push(newCount)
        cumulative += newCount
        totalUsers.push(cumulative)
      })

      userGrowthChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['新增用户', '累计用户'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates },
        yAxis: { type: 'value' },
        series: [
          {
            name: '新增用户',
            type: 'line',
            smooth: true,
            areaStyle: { color: 'rgba(64, 158, 255, 0.1)' },
            itemStyle: { color: '#409EFF' },
            data: newUsers
          },
          {
            name: '累计用户',
            type: 'line',
            smooth: true,
            itemStyle: { color: '#67C23A' },
            data: totalUsers
          }
        ]
      })
    } catch (error) {
      console.error('Failed to load user growth data:', error)
      ElMessage.error('加载用户增长数据失败')
    }
  }
}

// 初始化访问量图表
const initVisitChart = async () => {
  await nextTick()
  if (visitChartRef.value) {
    visitChart = echarts.init(visitChartRef.value)
    
    try {
      // 获取所有数据
      const [logsRes, videosRes, albumsRes] = await Promise.all([
        userActionLogApi.getAll(),
        videoApi.getAllVideos(),
        videoAlbumApi.getAllAlbums()
      ])

      const logs = Array.isArray(logsRes.data) ? logsRes.data : []
      const videos = Array.isArray(videosRes.data) ? videosRes.data : []
      const albums = Array.isArray(albumsRes.data) ? albumsRes.data : []

      // 构建视频ID到合集ID的映射
      const videoToAlbum: Record<number, number> = {}
      videos.forEach((v: any) => {
        if (v.id && v.albumId) {
          videoToAlbum[v.id] = v.albumId
        }
      })

      // 构建合集ID到标题的映射
      const albumIdToTitle: Record<number, string> = {}
      albums.forEach((a: any) => {
        if (a.id && a.title) {
          albumIdToTitle[a.id] = a.title
        }
      })

      // 统计每个合集的播放量
      const albumPlayCount: Record<number, number> = {}
      
      logs.forEach((log: any) => {
        // 匹配观看视频的日志，格式：观看了视频【ID:49，标题:疯狂动物城】
        const match = log.actionContent?.match(/观看了视频【ID:(\d+)/)
        if (match && log.actionType === 'WATCH_VIDEO') {
          const videoId = parseInt(match[1])
          const albumId = videoToAlbum[videoId]
          if (albumId) {
            albumPlayCount[albumId] = (albumPlayCount[albumId] || 0) + 1
          }
        }
      })

      // 转换为图表数据
      const courses: string[] = []
      const visits: number[] = []
      
      Object.entries(albumPlayCount)
        .sort((a, b) => b[1] - a[1]) // 按播放量降序
        .slice(0, 10) // 取前10个
        .forEach(([albumId, count]) => {
          const title = albumIdToTitle[Number(albumId)] || `合集${albumId}`
          courses.push(title.length > 10 ? title.slice(0, 10) + '...' : title)
          visits.push(count)
        })

      // 如果没有数据，显示提示
      if (courses.length === 0) {
        courses.push('暂无数据')
        visits.push(0)
      }

      visitChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: courses, axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: '播放量' },
        series: [{
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#66b1ff' }
            ])
          },
          data: visits
        }]
      })
    } catch (error) {
      console.error('Failed to load visit data:', error)
      visitChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: ['加载失败'], axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: '播放量' },
        series: [{
          type: 'bar',
          barWidth: '60%',
          data: [0]
        }]
      })
    }
  }
}

// 初始化用户占比图表
const initRoleChart = async () => {
  await nextTick()
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        name: '用户占比',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: roleCounts.value.student, name: '普通用户', itemStyle: { color: '#409EFF' } },
          // { value: roleCounts.value.teacher, name: '教师', itemStyle: { color: '#E6A23C' } },
          { value: roleCounts.value.admin, name: '系统管理员', itemStyle: { color: '#F56C6C' } },
          ...(roleCounts.value.other > 0 ? [{ value: roleCounts.value.other, name: '其他', itemStyle: { color: '#909399' } }] : [])
        ].filter(item => item.value > 0)
      }]
    })
  }
}

// 导出图表数据
const exportChartData = (_type: string) => {
  ElMessage.info('图表数据导出功能开发中...')
}

// 导出所有数据
// const exportAllData = () => {
//   exportDialogVisible.value = true
// }

// 确认导出
const confirmExport = async () => {
  if (exportForm.value.types.length === 0) {
    ElMessage.warning('请至少选择一种报表类型')
    return
  }

  exporting.value = true
  try {
    const workbook = XLSX.utils.book_new()

    if (exportForm.value.types.includes('users')) {
      const usersRes = await usersApi.getAllUsers()
      const users = Array.isArray(usersRes.data) ? usersRes.data : []
      const ws = XLSX.utils.json_to_sheet(users.map((u: any) => ({
        'ID': u.id,
        '用户名': u.username,
        '姓名': u.name,
        '邮箱': u.email,
        '角色': u.role,
        '状态': u.state === 1 ? '正常' : '禁用',
        '创建时间': u.createdAt,
        '更新时间': u.updatedAt
      })))
      XLSX.utils.book_append_sheet(workbook, ws, '用户数据')
    }

    if (exportForm.value.types.includes('vocabulary')) {
      const englishRes = await englishApi.getAllEnglish()
      const english = Array.isArray(englishRes.data) ? englishRes.data : []
      const ws = XLSX.utils.json_to_sheet(english.slice(0, 100).map((e: any) => ({
        'ID': e.id,
        '单词': e.content,
        '翻译': e.translation,
        '核心词': e.coreKey,
        '状态': e.status,
        '更新时间': e.updateDate
      })))
      XLSX.utils.book_append_sheet(workbook, ws, '词汇数据')
    }

    // 导出文件
    XLSX.writeFile(workbook, `学习平台报表_${new Date().toLocaleDateString()}.${exportForm.value.format}`)
    ElMessage.success('导出成功')
    exportDialogVisible.value = false
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 刷新所有数据
// const refreshAllData = async () => {
//   await fetchData()
//   await Promise.all([
//     initUserGrowthChart(),
//     initVisitChart(),
//     initRoleChart()
//   ])
//   ElMessage.success('数据已刷新')
// }

// 加载更多活动
// const loadMoreActivities = () => {
//   ElMessage.info('活动详情功能开发中...')
// }

const handleResize = () => {
  userGrowthChart?.resize()
  visitChart?.resize()
  pieChart?.resize()
}

// 监听时间范围变化，重新渲染用户增长图表
watch(userGrowthPeriod, () => {
  initUserGrowthChart()
})

onMounted(async () => {
  await fetchData()
  await Promise.all([
    initUserGrowthChart(),
    initVisitChart(),
    initRoleChart()
  ])
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  userGrowthChart?.dispose()
  visitChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-icon {
  font-size: 56px;
  opacity: 0.15;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-box {
  height: 320px;
}

.activity-card {
  border-radius: 8px;
}

.activity-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-icon {
  font-size: 16px;
  color: #409EFF;
}

.quick-actions-card {
  border-radius: 8px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  height: 80px;
  flex-direction: column;
  gap: 8px;
}

.action-btn span {
  margin-top: 4px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: #909399;
}
</style>
