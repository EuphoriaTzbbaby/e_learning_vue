<template>
  <div class="review-analytics">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="title">词汇复习数据分析</div>
              <div class="header-actions">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="~"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  @change="applyFilters"
                />
                <el-select v-model="userFilter" placeholder="按用户筛选" clearable filterable @change="applyFilters">
                  <el-option
                    v-for="u in userOptions"
                    :key="u.id"
                    :label="u.label"
                    :value="u.id"
                  />
                </el-select>
                <el-button :loading="loading" @click="fetchAll">刷新</el-button>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-card shadow="never" class="metric-card">
                <div class="metric-title">复习总次数</div>
                <div class="metric-value">{{ totalReviews }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="never" class="metric-card">
                <div class="metric-title">参与用户数</div>
                <div class="metric-value">{{ activeUsers }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="never" class="metric-card">
                <div class="metric-title">涉及单词数</div>
                <div class="metric-value">{{ activeWords }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="never" class="metric-card">
                <div class="metric-title">记住率（≥4）</div>
                <div class="metric-value">{{ rememberRate }}%</div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="section">
      <el-col :span="16">
        <el-card shadow="hover" header="最近 30 天复习趋势">
          <div v-if="totalReviews > 0" ref="trendRef" class="chart"></div>
          <el-empty v-else description="暂无复习数据" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" header="熟悉度分布">
          <div v-if="totalReviews > 0" ref="scoreRef" class="chart"></div>
          <el-empty v-else description="暂无复习数据" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="section">
      <el-col :span="12">
        <el-card shadow="hover" header="最难单词 Top 20（按平均分升序）">
          <el-table :data="topHardWords" stripe border style="width: 100%" v-loading="loading">
            <el-table-column label="单词" min-width="140">
              <template #default="{ row }">
                <span class="word">{{ row.word }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="avgScore" label="平均分" width="100" align="center" sortable />
            <el-table-column prop="minScore" label="最低分" width="100" align="center" sortable />
            <el-table-column prop="count" label="次数" width="100" align="center" sortable />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" header="活跃用户 Top 20（按复习次数）">
          <el-table :data="topActiveUsers" stripe border style="width: 100%" v-loading="loading">
            <el-table-column prop="label" label="用户" min-width="220" />
            <el-table-column prop="count" label="次数" width="100" align="center" sortable />
            <el-table-column prop="avgScore" label="平均分" width="100" align="center" sortable />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.state === 1" type="danger">禁用</el-tag>
                <el-tag v-else type="success">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import reviewLogApi from '../../api/reviewLog'
import englishApi from '../../api/english'
import usersApi from '../../api/users'
import type { ReviewLog } from '../../interface/reviewLog'
import type { English } from '../../interface/english'
import type { Users } from '../../interface/users'
import { ElMessage } from 'element-plus'

type UserOption = { id: number; label: string }

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const userFilter = ref<number | null>(null)

const allLogs = ref<ReviewLog[]>([])
const filteredLogs = ref<ReviewLog[]>([])
const englishByEgId = ref(new Map<number, English>())
const userById = ref(new Map<number, Users>())

const TZ = 'Asia/Shanghai'
const DAY_MS = 24 * 60 * 60 * 1000
const chinaDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const chinaWeekFormatter = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' })

const chinaYMD = (ms: number) => chinaDateFormatter.format(new Date(ms))

const getLogYMD = (val: any) => {
  const s = typeof val === 'string' ? val : String(val ?? '')
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const t = Date.parse(s)
  if (Number.isFinite(t)) return chinaYMD(t)
  return null
}

const userOptions = computed<UserOption[]>(() => {
  const arr: UserOption[] = []
  for (const u of userById.value.values()) {
    const label = `${u.username || u.email || '未知用户'} (${u.id})`
    arr.push({ id: u.id, label })
  }
  return arr.sort((a, b) => a.id - b.id)
})

const normalizeScore = (s: any) => {
  const n = typeof s === 'number' ? s : Number(s)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, Math.round(n)))
}

const getEnglish = (egId: number) => englishByEgId.value.get(egId)
const getWord = (egId: number) => getEnglish(egId)?.content || `#${egId}`

const totalReviews = computed(() => filteredLogs.value.length)
const activeUsers = computed(() => new Set(filteredLogs.value.map((l) => l.userId)).size)
const activeWords = computed(() => new Set(filteredLogs.value.map((l) => l.egId)).size)
const rememberRate = computed(() => {
  if (!totalReviews.value) return 0
  const ok = filteredLogs.value.filter((l) => normalizeScore(l.score) >= 4).length
  return Math.round((ok / totalReviews.value) * 100)
})

const trendRef = ref<HTMLElement | null>(null)
const scoreRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let scoreChart: echarts.ECharts | null = null

const movingAvg = (arr: number[], windowSize: number) => {
  const out: Array<number | null> = new Array(arr.length).fill(null)
  if (windowSize <= 1) return arr.map((v) => v)
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
    if (i >= windowSize) sum -= arr[i - windowSize]
    if (i >= windowSize - 1) out[i] = Number((sum / windowSize).toFixed(2))
  }
  return out
}

const buildTrendData = () => {
  const days: string[] = []
  const countMap = new Map<string, number>()
  const okMap = new Map<string, number>()

  for (let i = 29; i >= 0; i--) {
    const d = chinaYMD(Date.now() - i * DAY_MS)
    days.push(d)
    countMap.set(d, 0)
    okMap.set(d, 0)
  }

  for (const log of filteredLogs.value) {
    const d = getLogYMD(log.lastReview)
    if (!d) continue
    if (!countMap.has(d)) continue
    countMap.set(d, (countMap.get(d) || 0) + 1)
    if (normalizeScore(log.score) >= 4) okMap.set(d, (okMap.get(d) || 0) + 1)
  }

  const counts = days.map((d) => countMap.get(d) || 0)
  const oks = days.map((d) => okMap.get(d) || 0)
  const misses = days.map((d) => Math.max(0, (countMap.get(d) || 0) - (okMap.get(d) || 0)))
  const rates = days.map((d) => {
    const c = countMap.get(d) || 0
    const ok = okMap.get(d) || 0
    return c ? Math.round((ok / c) * 100) : 0
  })

  const avg7Counts = movingAvg(counts, 7)
  const avg7Rates = movingAvg(rates, 7)

  const weekendRanges: Array<[string, string]> = []
  let currentStart: string | null = null
  for (let i = 0; i < days.length; i++) {
    const dayMs = Date.now() - (29 - i) * DAY_MS
    const w = chinaWeekFormatter.format(new Date(dayMs))
    const isWeekend = w === 'Sat' || w === 'Sun'
    if (isWeekend && !currentStart) currentStart = days[i]
    if (!isWeekend && currentStart) {
      weekendRanges.push([currentStart, days[i - 1]])
      currentStart = null
    }
  }
  if (currentStart) weekendRanges.push([currentStart, days[days.length - 1]])

  return { days, counts, oks, misses, rates, avg7Counts, avg7Rates, weekendRanges }
}

const buildScoreDist = () => {
  const buckets = [0, 0, 0, 0, 0, 0]
  for (const log of filteredLogs.value) {
    const s = normalizeScore(log.score)
    buckets[s] += 1
  }
  return buckets
}

const topHardWords = computed(() => {
  const m = new Map<number, { egId: number; count: number; sum: number; min: number }>()
  for (const log of filteredLogs.value) {
    const s = normalizeScore(log.score)
    const egId = log.egId
    const cur = m.get(egId) || { egId, count: 0, sum: 0, min: 5 }
    cur.count += 1
    cur.sum += s
    cur.min = Math.min(cur.min, s)
    m.set(egId, cur)
  }
  return Array.from(m.values())
    .map((x) => ({
      egId: x.egId,
      word: getWord(x.egId),
      avgScore: Number((x.sum / x.count).toFixed(2)),
      minScore: x.min,
      count: x.count
    }))
    .sort((a, b) => a.avgScore - b.avgScore || b.count - a.count)
    .slice(0, 20)
})

const topActiveUsers = computed(() => {
  const m = new Map<number, { userId: number; count: number; sum: number }>()
  for (const log of filteredLogs.value) {
    const s = normalizeScore(log.score)
    const userId = log.userId
    const cur = m.get(userId) || { userId, count: 0, sum: 0 }
    cur.count += 1
    cur.sum += s
    m.set(userId, cur)
  }
  return Array.from(m.values())
    .map((x) => {
      const u = userById.value.get(x.userId)
      const label = `${u?.username || u?.email || '未知用户'} (${x.userId})`
      return {
        userId: x.userId,
        label,
        state: u?.state ?? 0,
        count: x.count,
        avgScore: Number((x.sum / x.count).toFixed(2))
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
})

const renderCharts = async () => {
  await nextTick()
  if (!trendRef.value || !scoreRef.value) return

  const { days, counts, oks, misses, rates, avg7Counts, avg7Rates, weekendRanges } = buildTrendData()
  const buckets = buildScoreDist()

  if (!trendChart) trendChart = echarts.init(trendRef.value)
  if (!scoreChart) scoreChart = echarts.init(scoreRef.value)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : []
        const axis = items[0]?.axisValue || ''
        const total = counts[days.indexOf(axis)] ?? 0
        const ok = oks[days.indexOf(axis)] ?? 0
        const miss = misses[days.indexOf(axis)] ?? 0
        const rate = rates[days.indexOf(axis)] ?? 0
        const avgC = avg7Counts[days.indexOf(axis)]
        const avgR = avg7Rates[days.indexOf(axis)]
        const lines = [
          `<div style="font-weight:700;margin-bottom:6px;">${axis}</div>`,
          `复习次数：${total}`,
          `已记住(≥4)：${ok}`,
          `未记住(<4)：${miss}`,
          `记住率：${rate}%`
        ]
        if (avgC !== null && avgC !== undefined) lines.push(`7日均值(次数)：${avgC}`)
        if (avgR !== null && avgR !== undefined) lines.push(`7日均值(记住率)：${avgR}%`)
        return lines.join('<br/>')
      }
    },
    legend: { data: ['已记住(≥4)', '未记住(<4)', '记住率%', '7日均值(次数)', '7日均值(记住率)'] },
    grid: { left: 44, right: 28, top: 48, bottom: 36 },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: { formatter: (v: string) => v.slice(5) },
      axisTick: { alignWithLabel: true }
    },
    yAxis: [
      { type: 'value', name: '次数' },
      { type: 'value', name: '%', min: 0, max: 100 }
    ],
    series: [
      {
        name: '已记住(≥4)',
        type: 'bar',
        stack: 'count',
        data: oks,
        itemStyle: { color: '#67C23A' },
        barMaxWidth: 18,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(64, 158, 255, 0.08)' },
          data: weekendRanges.map(([s, e]) => [{ xAxis: s }, { xAxis: e }])
        }
      },
      {
        name: '未记住(<4)',
        type: 'bar',
        stack: 'count',
        data: misses,
        itemStyle: { color: '#F56C6C' },
        barMaxWidth: 18
      },
      {
        name: '记住率%',
        type: 'line',
        yAxisIndex: 1,
        data: rates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '7日均值(次数)',
        type: 'line',
        data: avg7Counts,
        smooth: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', width: 2, color: '#E6A23C' },
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '7日均值(记住率)',
        type: 'line',
        yAxisIndex: 1,
        data: avg7Rates,
        smooth: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', width: 2, color: '#A855F7' },
        itemStyle: { color: '#A855F7' }
      }
    ]
  })

  scoreChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['0', '1', '2', '3', '4', '5'], name: '分数' },
    yAxis: { type: 'value', name: '次数' },
    series: [
      {
        type: 'bar',
        data: buckets,
        itemStyle: { color: '#E6A23C' }
      }
    ]
  })
}

const applyFilters = () => {
  const range = dateRange.value
  const uid = userFilter.value
  filteredLogs.value = allLogs.value.filter((log) => {
    if (uid !== null && log.userId !== uid) return false
    if (range && range[0] && range[1]) {
      const d = getLogYMD(log.lastReview)
      if (!d) return false
      if (d < range[0] || d > range[1]) return false
    }
    return true
  })
  if (filteredLogs.value.length > 0) renderCharts()
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [logsRes, usersRes] = await Promise.all([
      reviewLogApi.getAllReviewLogs(),
      usersApi.getAllUsers()
    ])
    const logs = Array.isArray(logsRes.data) ? (logsRes.data as ReviewLog[]) : []
    allLogs.value = logs

    const users = Array.isArray(usersRes.data) ? (usersRes.data as Users[]) : []
    const um = new Map<number, Users>()
    for (const u of users) {
      if (typeof u?.id === 'number') um.set(u.id, u)
    }
    userById.value = um

    const egIds = Array.from(new Set(logs.map((l) => l.egId).filter((id) => typeof id === 'number')))
    if (egIds.length > 0) {
      const englishRes = await englishApi.getEnglishByIds(egIds)
      const list = Array.isArray(englishRes.data) ? (englishRes.data as English[]) : []
      const em = new Map<number, English>()
      for (const e of list) {
        if (typeof e?.egId === 'number') em.set(e.egId, e)
      }
      englishByEgId.value = em
    } else {
      englishByEgId.value = new Map()
    }

    applyFilters()
  } catch (e) {
    console.error(e)
    ElMessage.error('获取复习数据失败')
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  trendChart?.resize()
  scoreChart?.resize()
}

onMounted(async () => {
  await fetchAll()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  scoreChart?.dispose()
})
</script>

<style scoped>
.review-analytics {
  padding: 0;
}

.section {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-card {
  background: transparent;
}

.metric-title {
  font-size: 13px;
  color: #909399;
}

.metric-value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  color: #303133;
}

.chart {
  height: 360px;
}

.word {
  font-weight: 700;
}
</style>
