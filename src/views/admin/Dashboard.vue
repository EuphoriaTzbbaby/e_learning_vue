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
              <div class="stat-trend" :class="card.trend > 0 ? 'up' : 'down'">
                <el-icon v-if="card.trend > 0"><ArrowUp /></el-icon>
                <el-icon v-else><ArrowDown /></el-icon>
                <span>{{ Math.abs(card.trend) }}%</span>
              </div>
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

      <!-- 记忆曲线 -->
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">学习记忆曲线</span>
          </template>
          <div ref="memoryChartRef" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 高频词汇 -->
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">高频词汇TOP10</span>
              <el-button type="primary" link size="small" @click="goToEnglishManage">
                查看详情
              </el-button>
            </div>
          </template>
          <div ref="wordCloudChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动和快捷操作 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近活动</span>
              <el-button text @click="loadMoreActivities">
                <el-icon><More /></el-icon>
                查看更多
              </el-button>
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
                <el-icon class="activity-icon">
                  <component :is="activity.icon" />
                </el-icon>
                <span>{{ activity.content }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="recentActivities.length === 0" description="暂无活动记录" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="quick-actions-card">
          <template #header>
            <span class="card-title">快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" class="action-btn" @click="goToUserManage">
              <el-icon><UserFilled /></el-icon>
              <span>用户管理</span>
            </el-button>
            <el-button type="success" class="action-btn" @click="goToEnglishManage">
              <el-icon><Reading /></el-icon>
              <span>词汇管理</span>
            </el-button>
            <el-button type="warning" class="action-btn" @click="exportAllData">
              <el-icon><Download /></el-icon>
              <span>导出报表</span>
            </el-button>
            <el-button type="info" class="action-btn" @click="refreshAllData">
              <el-icon><Refresh /></el-icon>
              <span>刷新数据</span>
            </el-button>
          </div>
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
import { computed, nextTick, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import {
  User,
  VideoCamera,
  // Collection,
  ChatDotRound,
  Reading,
  ArrowUp,
  ArrowDown,
  Download,
  More,
  UserFilled,
  Refresh,
  DocumentAdd,
  Edit,
  // Delete
} from '@element-plus/icons-vue'
import videoApi from '../../api/video'
import videoAlbumApi from '../../api/videoAlbum'
import commentApi from '../../api/comment'
import usersApi from '../../api/users'
import englishApi from '../../api/english'
// import reviewLogApi from '../../api/reviewLog'

const router = useRouter()

// 图表引用
const userGrowthChartRef = ref<HTMLElement | null>(null)
const visitChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
const memoryChartRef = ref<HTMLElement | null>(null)
const wordCloudChartRef = ref<HTMLElement | null>(null)

let userGrowthChart: echarts.ECharts | null = null
let visitChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null
let wordCloudChart: echarts.ECharts | null = null

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
  { title: '总用户数', value: '0', icon: User, color: '#409EFF', trend: 12.5 },
  { title: '视频总数', value: '0', icon: VideoCamera, color: '#67C23A', trend: 8.3 },
  { title: '词汇总数', value: '0', icon: Reading, color: '#E6A23C', trend: -2.1 },
  { title: '总评论数', value: '0', icon: ChatDotRound, color: '#F56C6C', trend: 15.8 }
])

const roleCounts = ref({ student: 0, teacher: 0, admin: 0, other: 0 })
const roleTotal = computed(() => {
  return roleCounts.value.student + roleCounts.value.teacher + roleCounts.value.admin + roleCounts.value.other
})

// 模拟最近活动数据
const recentActivities = ref([
  { content: '新用户 user10@example.com 完成注册', time: '5分钟前', type: 'success', icon: User },
  { content: '管理员添加了新词汇 "artificial intelligence"', time: '15分钟前', type: 'primary', icon: DocumentAdd },
  { content: '用户 student5 完成了词汇复习', time: '30分钟前', type: 'info', icon: Reading },
  { content: '新视频 "Vue3 进阶教程" 已上传', time: '1小时前', type: 'warning', icon: VideoCamera },
  { content: '用户 teacher2 更新了课程内容', time: '2小时前', type: '', icon: Edit }
])

// 获取数据
const fetchData = async () => {
  try {
    const [videosRes, _albumsRes, commentsRes, usersRes, englishRes] = await Promise.all([
      videoApi.getAllVideos(),
      videoAlbumApi.getAllAlbums(),
      commentApi.getAllComments(),
      usersApi.getAllUsers(),
      englishApi.getAllEnglish()
    ])

    const users = Array.isArray(usersRes.data) ? usersRes.data : []
    statCards.value[0].value = users.length.toString()
    statCards.value[1].value = Array.isArray(videosRes.data) ? videosRes.data.length.toString() : '0'
    statCards.value[2].value = Array.isArray(englishRes.data) ? englishRes.data.length.toString() : '0'
    statCards.value[3].value = Array.isArray(commentsRes.data) ? commentsRes.data.length.toString() : '0'

    const nextRoleCounts = { student: 0, teacher: 0, admin: 0, other: 0 }
    for (const u of users) {
      const role = typeof u?.role === 'string' ? u.role : ''
      if (role === 'student') nextRoleCounts.student += 1
      else if (role === 'teacher') nextRoleCounts.teacher += 1
      else if (role === 'admin') nextRoleCounts.admin += 1
      else nextRoleCounts.other += 1
    }
    roleCounts.value = nextRoleCounts
  } catch (error) {
    console.error('Fetch dashboard data failed:', error)
  }
}

// 初始化用户增长图表
const initUserGrowthChart = async () => {
  await nextTick()
  if (userGrowthChartRef.value) {
    userGrowthChart = echarts.init(userGrowthChartRef.value)
    
    // 模拟数据
    const days = userGrowthPeriod.value === 'week' ? 7 : 30
    const dates: string[] = []
    const newUsers: number[] = []
    const totalUsers: number[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
      const newCount = Math.floor(Math.random() * 20) + 5
      newUsers.push(newCount)
      totalUsers.push(totalUsers.length > 0 ? totalUsers[totalUsers.length - 1] + newCount : 150)
    }

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
  }
}

// 初始化访问量图表
const initVisitChart = async () => {
  await nextTick()
  if (visitChartRef.value) {
    visitChart = echarts.init(visitChartRef.value)
    
    // 模拟数据
    const courses = ['Vue3基础', 'React入门', 'TypeScript', 'Node.js', 'Python', '数据结构']
    const visits = [1250, 980, 850, 720, 680, 590]

    visitChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: courses, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '访问量' },
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
          { value: roleCounts.value.student, name: '学生', itemStyle: { color: '#409EFF' } },
          { value: roleCounts.value.teacher, name: '教师', itemStyle: { color: '#E6A23C' } },
          { value: roleCounts.value.admin, name: '管理员', itemStyle: { color: '#F56C6C' } },
          ...(roleCounts.value.other > 0 ? [{ value: roleCounts.value.other, name: '其他', itemStyle: { color: '#909399' } }] : [])
        ].filter(item => item.value > 0)
      }]
    })
  }
}

// 初始化记忆曲线图表
const initMemoryChart = async () => {
  await nextTick()
  if (memoryChartRef.value) {
    memoryChart = echarts.init(memoryChartRef.value)
    
    // 艾宾浩斯记忆曲线模拟数据
    const hours = ['0h', '1h', '8h', '1d', '2d', '6d', '15d', '30d']
    const retention = [100, 44, 36, 33, 28, 25, 21, 15]

    memoryChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: hours, name: '时间' },
      yAxis: { type: 'value', name: '记忆保留率(%)', max: 100 },
      series: [{
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(230, 162, 60, 0.1)' },
        itemStyle: { color: '#E6A23C' },
        data: retention,
        markLine: {
          data: [
            { yAxis: 50, label: { position: 'end', formatter: '警戒线' }, lineStyle: { color: '#F56C6C', type: 'dashed' } }
          ]
        }
      }]
    })
  }
}

// 初始化高频词汇图表
const initWordCloudChart = async () => {
  await nextTick()
  if (wordCloudChartRef.value) {
    wordCloudChart = echarts.init(wordCloudChartRef.value)
    
    // 模拟高频词汇数据
    const words = [
      { name: 'algorithm', value: 156 },
      { name: 'function', value: 142 },
      { name: 'variable', value: 128 },
      { name: 'component', value: 115 },
      { name: 'interface', value: 98 },
      { name: 'module', value: 87 },
      { name: 'promise', value: 76 },
      { name: 'async', value: 65 },
      { name: 'class', value: 58 },
      { name: 'method', value: 52 }
    ]

    wordCloudChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: words.map(w => w.name).reverse() },
      series: [{
        type: 'bar',
        data: words.map(w => w.value).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#E6A23C' },
            { offset: 1, color: '#f0c78a' }
          ])
        }
      }]
    })
  }
}

// 导出图表数据
const exportChartData = (_type: string) => {
  ElMessage.info('图表数据导出功能开发中...')
}

// 导出所有数据
const exportAllData = () => {
  exportDialogVisible.value = true
}

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
const refreshAllData = async () => {
  await fetchData()
  await Promise.all([
    initUserGrowthChart(),
    initVisitChart(),
    initRoleChart(),
    initMemoryChart(),
    initWordCloudChart()
  ])
  ElMessage.success('数据已刷新')
}

// 跳转到用户管理
const goToUserManage = () => {
  router.push('/admin/users')
}

// 跳转到词汇管理
const goToEnglishManage = () => {
  router.push('/admin/english')
}

// 加载更多活动
const loadMoreActivities = () => {
  ElMessage.info('活动详情功能开发中...')
}

const handleResize = () => {
  userGrowthChart?.resize()
  visitChart?.resize()
  pieChart?.resize()
  memoryChart?.resize()
  wordCloudChart?.resize()
}

onMounted(async () => {
  await fetchData()
  await Promise.all([
    initUserGrowthChart(),
    initVisitChart(),
    initRoleChart(),
    initMemoryChart(),
    initWordCloudChart()
  ])
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  userGrowthChart?.dispose()
  visitChart?.dispose()
  pieChart?.dispose()
  memoryChart?.dispose()
  wordCloudChart?.dispose()
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

.stat-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 2px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
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
