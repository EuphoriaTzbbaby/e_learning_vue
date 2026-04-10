<template>
  <div class="english-manage">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">总词汇数</div>
              <div class="stat-value">{{ uniqueCount }}</div>
            </div>
            <el-icon class="stat-icon"><Reading /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">高频词汇</div>
              <div class="stat-value">{{ frequentWords.length }}</div>
            </div>
            <el-icon class="stat-icon" style="color: #E6A23C"><Star /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">已推荐</div>
              <div class="stat-value">{{ recommendedCount }}</div>
            </div>
            <el-icon class="stat-icon" style="color: #67C23A"><Promotion /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主内容 -->
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="title-section">
            <div class="title">词汇管理</div>
            <el-tag v-if="rawCount > 0" type="info" effect="plain" size="small">
              去重后 {{ uniqueCount }} 条（原始 {{ rawCount }} 条，重复 {{ duplicateCount }} 条）
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button type="success" @click="exportVocabulary" :icon="Download">
              导出词汇
            </el-button>
          </div>
        </div>
      </template>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="词汇列表" name="list">
          <div class="filters">
            <el-input
              v-model="keyword"
              placeholder="搜索单词 / 翻译 / 核心词 / 用户ID"
              clearable
              class="search-input"
              @keyup.enter="currentPage = 1"
            />
            <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="已删除" value="deleted" />
            </el-select>
            <el-button type="primary" @click="currentPage = 1" :icon="Search">搜索</el-button>
            <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
          </div>

          <el-table 
            v-loading="loading" 
            :data="pagedRows" 
            border 
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="content" label="外文" min-width="180">
              <template #default="{ row }">
                <span class="word">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="translation" label="翻译" min-width="220" show-overflow-tooltip />
            <el-table-column prop="coreKey" label="类型" width="140" align="center" />
            <el-table-column prop="isDeleted" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isDeleted == '0'" type="success">正常</el-tag>
                <el-tag v-else type="danger">已删除</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updateDate" label="更新时间" width="180" align="center" sortable />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                <el-divider direction="vertical" />
                <el-button link type="danger" @click="deleteWord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-if="filteredRows.length"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="filteredRows.length"
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="高频词汇" name="frequent">
          <el-alert
            title="高频词汇说明"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          >
            统计所有用户词汇本中的高频词汇，并可以推荐给全体用户学习
          </el-alert>

          <el-table :data="frequentWords" border stripe>
            <el-table-column prop="content" label="单词" min-width="180">
              <template #default="{ row }">
                <span class="word">{{ row.content }}</span>
                <el-tag v-if="row.isRecommended" type="success" size="small" style="margin-left: 8px">
                  已推荐
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="translation" label="翻译" min-width="220" show-overflow-tooltip />
            <el-table-column prop="frequency" label="学习次数" width="120" align="center" sortable>
              <template #default="{ row }">
                <el-tag type="warning">{{ row.frequency }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="{ row }">
                <el-button 
                  v-if="!row.isRecommended" 
                  type="primary" 
                  size="small"
                  @click="recommendWord(row)"
                >
                  推荐给全体用户
                </el-button>
                <el-button 
                  v-else 
                  type="info" 
                  size="small"
                  @click="cancelRecommend(row)"
                >
                  取消推荐
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="词汇统计" name="stats">
          <el-row :gutter="20">
            <el-col :span="12">
              <div ref="categoryChartRef" class="chart-box"></div>
            </el-col>
            <el-col :span="12">
              <div ref="trendChartRef" class="chart-box"></div>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑词汇' : '新增词汇'" width="600px">
      <el-form :model="formWord" label-width="100px">
        <el-form-item label="单词" required>
          <el-input v-model="formWord.content" placeholder="请输入单词" />
        </el-form-item>
        <el-form-item label="翻译" required>
          <el-input v-model="formWord.translation" placeholder="请输入翻译" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="核心词">
          <el-input v-model="formWord.coreKey" placeholder="请输入核心词" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWord" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import englishApi from '../../api/english'
import type { English } from '../../interface/english'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Reading,
  Star,
  Promotion,
  Download,
  Search,
  Refresh
} from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const activeTab = ref('list')
const dialogVisible = ref(false)
const isEditMode = ref(false)
const rawRows = ref<English[]>([])
const selectedWords = ref<English[]>([])

const categoryChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
let categoryChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const formWord = ref<any>({
  id: null,
  content: '',
  translation: '',
  coreKey: ''
})

const normalizeKey = (s: string) => s.trim().toLowerCase()

const pickNewer = (a: English, b: English) => {
  const ta = dayjs(a.updateDate || a.createDate || 0).valueOf()
  const tb = dayjs(b.updateDate || b.createDate || 0).valueOf()
  return tb >= ta ? b : a
}

const uniqueRows = computed(() => {
  const map = new Map<string, English>()
  for (const row of rawRows.value) {
    const content = typeof row?.content === 'string' ? row.content : ''
    const key = normalizeKey(content)
    if (!key) continue
    const existed = map.get(key)
    if (!existed) {
      map.set(key, row)
      continue
    }
    map.set(key, pickNewer(existed, row))
  }
  return Array.from(map.values()).sort((a, b) => (b.egId || 0) - (a.egId || 0))
})

const filteredRows = computed(() => {
  let result = uniqueRows.value
  const kw = keyword.value.trim().toLowerCase()
  
  if (kw) {
    result = result.filter((r) => {
      const a = (r.content || '').toLowerCase()
      const b = (r.translation || '').toLowerCase()
      const c = (r.coreKey || '').toLowerCase()
      const d = String(r.userId || '')
      return a.includes(kw) || b.includes(kw) || c.includes(kw) || d.includes(kw)
    })
  }

  if (statusFilter.value) {
    if (statusFilter.value === 'deleted') {
      result = result.filter(r => r.isDeleted != '0')
    } else {
      result = result.filter(r => r.isDeleted == '0')
    }
  }

  return result
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const rawCount = computed(() => rawRows.value.length)
const uniqueCount = computed(() => uniqueRows.value.length)
const duplicateCount = computed(() => Math.max(0, rawCount.value - uniqueCount.value))
const recommendedCount = computed(() => frequentWords.value.filter(w => w.isRecommended).length)

// 模拟高频词汇数据
const frequentWords = ref<any[]>([
  { content: 'algorithm', translation: '算法', frequency: 156, isRecommended: true },
  { content: 'function', translation: '函数', frequency: 142, isRecommended: true },
  { content: 'variable', translation: '变量', frequency: 128, isRecommended: false },
  { content: 'component', translation: '组件', frequency: 115, isRecommended: false },
  { content: 'interface', translation: '接口', frequency: 98, isRecommended: false }
])

const fetchList = async () => {
  loading.value = true
  try {
    const res = await englishApi.getAllEnglish()
    rawRows.value = Array.isArray(res.data) ? (res.data as English[]) : []
    currentPage.value = 1
  } catch (e) {
    console.error(e)
    ElMessage.error('获取词汇列表失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection: English[]) => {
  selectedWords.value = selection
}

const handleTabChange = (name: string) => {
  if (name === 'stats') {
    nextTick(() => {
      initCharts()
    })
  }
}

const openEditDialog = (word: English) => {
  isEditMode.value = true
  formWord.value = { ...word }
  dialogVisible.value = true
}

const resetFilters = () => {
  keyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

const submitWord = async () => {
  if (!formWord.value.content || !formWord.value.translation) {
    ElMessage.warning('请填写单词和翻译')
    return
  }

  submitting.value = true
  try {
    if (isEditMode.value) {
      await englishApi.updateEnglish(formWord.value)
      ElMessage.success('词汇更新成功')
    } else {
      // 新增时设置默认值
      const payload = {
        ...formWord.value,
        isDeleted: '0',
        createDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      await englishApi.addEnglish(payload)
      ElMessage.success('词汇添加成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('Submit word failed:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteWord = async (word: English) => {
  try {
    await ElMessageBox.confirm('确定要删除该词汇吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // 逻辑删除：将 isDeleted 设置为 '1'
    await englishApi.updateEnglish({ 
      ...word, 
      isDeleted: '1',
      updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete word failed:', error)
      ElMessage.error('删除失败')
    }
  }
}

const recommendWord = async (word: any) => {
  try {
    // 这里应该调用API将词汇推荐给全体用户
    await ElMessageBox.confirm(
      `确定要将"${word.content}"推荐给全体用户吗？`,
      '推荐确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    word.isRecommended = true
    ElMessage.success('推荐成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Recommend failed:', error)
    }
  }
}

const cancelRecommend = async (word: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消"${word.content}"的推荐吗？`,
      '取消推荐',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    word.isRecommended = false
    ElMessage.success('已取消推荐')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel recommend failed:', error)
    }
  }
}

const exportVocabulary = () => {
  const exportData = filteredRows.value.map(w => ({
    '用户ID': w.userId,
    '单词': w.content,
    '翻译': w.translation,
    '核心词': w.coreKey,
    '状态': w.isDeleted == '0' ? '正常' : '已删除',
    '更新时间': w.updateDate || ''
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '词汇列表')
  XLSX.writeFile(wb, `词汇数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`)
  ElMessage.success(`导出成功，共 ${exportData.length} 条数据`)
}

const initCharts = async () => {
  await nextTick()
  
  // 词汇分类统计（按 coreKey 分类，使用去重后的数据）
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
    
    // 统计每个 coreKey 的数量
    const coreKeyMap = new Map<string, number>()
    uniqueRows.value.forEach(row => {
      const key = row.coreKey || '未分类'
      coreKeyMap.set(key, (coreKeyMap.get(key) || 0) + 1)
    })
    
    // 转换为图表数据格式
    const categoryData = Array.from(coreKeyMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // 按数量降序排列
    
    categoryChart.setOption({
      title: { text: '词汇分类统计', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [{
        name: '词汇分类',
        type: 'pie',
        radius: '50%',
        data: categoryData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }

  // 词汇增长趋势（近7天）
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    
    // 统计近7天的新增词汇数
    const days: string[] = []
    const counts: number[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      days.push(date.format('M/D'))
      
      // 统计当天新增的词汇数量
      const dayCount = rawRows.value.filter(row => {
        const createDate = dayjs(row.createDate).format('YYYY-MM-DD')
        return createDate === dateStr
      }).length
      
      counts.push(dayCount)
    }

    trendChart.setOption({
      title: { text: '词汇增长趋势（近7天）', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: '新增词汇数' },
      series: [{
        data: counts,
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(64, 158, 255, 0.1)' },
        itemStyle: { color: '#409EFF' }
      }]
    })
  }
}

onMounted(fetchList)
</script>

<style scoped>
.english-manage {
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
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
}

.search-input {
  width: 300px;
}

.word {
  font-weight: 600;
  color: #303133;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.chart-box {
  height: 350px;
}
</style>
