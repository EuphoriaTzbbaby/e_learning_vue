<template>
  <div class="review-log-manage">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="title">词汇复习记录管理</div>
          <div class="header-actions">
            <el-button :loading="loading" @click="fetchAll">刷新</el-button>
            <el-button
              v-if="selectedIds.length > 0"
              type="danger"
              :loading="deleteLoading"
              @click="batchDelete"
            >
              批量删除 ({{ selectedIds.length }})
            </el-button>
          </div>
        </div>
      </template>

      <div class="filters">
        <el-input
          v-model="keyword"
          placeholder="搜索单词/翻译/核心词"
          clearable
          class="filter-item keyword"
          @keyup.enter="currentPage = 1"
        />
        <el-input
          v-model="userIdText"
          placeholder="用户ID"
          clearable
          class="filter-item userId"
          @keyup.enter="currentPage = 1"
        />
        <el-select v-model="scoreFilter" placeholder="熟悉度" clearable class="filter-item score">
          <el-option v-for="n in 5" :key="n" :label="String(n)" :value="n" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="filter-item date"
          @change="currentPage = 1"
        />
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedRows"
        border
        stripe
        style="width: 100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="logId" label="日志ID" width="100" align="center" sortable />
        <el-table-column label="用户" width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-name">{{ getUserName(row.userId) }}</span>
              <el-tag v-if="getUserState(row.userId) === 1" type="danger" size="small">禁用</el-tag>
              <span class="user-id">({{ row.userId }})</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单词" min-width="160">
          <template #default="{ row }">
            <span class="word">{{ getEnglish(row.egId)?.content || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="翻译" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getEnglish(row.egId)?.translation || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="核心词" width="120" align="center">
          <template #default="{ row }">
            {{ getEnglish(row.egId)?.coreKey || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="熟悉度" width="110" align="center" sortable>
          <template #default="{ row }">
            <el-tag :type="scoreTagType(row.score)">{{ normalizeScore(row.score) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastReview" label="复习时间" width="180" align="center" sortable />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" :loading="deleteLoading" @click="deleteOne(row.logId)">删除</el-button>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import reviewLogApi from '../../api/reviewLog'
import englishApi from '../../api/english'
import usersApi from '../../api/users'
import type { ReviewLog } from '../../interface/reviewLog'
import type { English } from '../../interface/english'
import type { Users } from '../../interface/users'

const loading = ref(false)
const deleteLoading = ref(false)

const keyword = ref('')
const userIdText = ref('')
const scoreFilter = ref<number | null>(null)
const dateRange = ref<[string, string] | null>(null)

const currentPage = ref(1)
const pageSize = ref(20)
const selectedIds = ref<number[]>([])

const rawLogs = ref<ReviewLog[]>([])
const englishByEgId = ref(new Map<number, English>())
const userById = ref(new Map<number, Users>())

const normalizeScore = (s: any) => {
  const n = typeof s === 'number' ? s : Number(s)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, Math.round(n)))
}

const scoreTagType = (s: any) => {
  const v = normalizeScore(s)
  if (v >= 4) return 'success'
  if (v === 3) return 'warning'
  return 'danger'
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [logsRes, usersRes] = await Promise.all([
      reviewLogApi.getAllReviewLogs(),
      usersApi.getAllUsers()
    ])

    const logs = Array.isArray(logsRes.data) ? (logsRes.data as ReviewLog[]) : []
    rawLogs.value = logs

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

    currentPage.value = 1
  } catch (e) {
    console.error(e)
    ElMessage.error('获取复习日志失败')
  } finally {
    loading.value = false
  }
}

const getEnglish = (egId: number) => englishByEgId.value.get(egId)
const getUserName = (userId: number) => userById.value.get(userId)?.username || userById.value.get(userId)?.email || '未知用户'
const getUserState = (userId: number) => userById.value.get(userId)?.state

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const uid = userIdText.value.trim() ? Number(userIdText.value.trim()) : null
  const score = scoreFilter.value
  const range = dateRange.value

  return rawLogs.value.filter((log) => {
    if (uid !== null && Number.isFinite(uid) && log.userId !== uid) return false
    if (score !== null && normalizeScore(log.score) !== score) return false

    if (range && range[0] && range[1]) {
      const t = dayjs(log.lastReview)
      if (!t.isValid()) return false
      const start = dayjs(range[0]).startOf('day')
      const end = dayjs(range[1]).endOf('day')
      if (t.valueOf() < start.valueOf() || t.valueOf() > end.valueOf()) return false
    }

    if (kw) {
      const e = getEnglish(log.egId)
      const a = (e?.content || '').toLowerCase()
      const b = (e?.translation || '').toLowerCase()
      const c = (e?.coreKey || '').toLowerCase()
      if (!a.includes(kw) && !b.includes(kw) && !c.includes(kw)) return false
    }

    return true
  })
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const onSelectionChange = (rows: ReviewLog[]) => {
  selectedIds.value = rows.map((r) => r.logId)
}

const resetFilters = () => {
  keyword.value = ''
  userIdText.value = ''
  scoreFilter.value = null
  dateRange.value = null
  currentPage.value = 1
}

const deleteOne = async (logId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该复习记录吗？此操作不可撤销。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    deleteLoading.value = true
    await reviewLogApi.deleteReviewLog(logId)
    ElMessage.success('删除成功')
    await fetchAll()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('删除失败')
    }
  } finally {
    deleteLoading.value = false
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定要批量删除选中的 ${selectedIds.value.length} 条记录吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    deleteLoading.value = true
    await Promise.all(selectedIds.value.map((id) => reviewLogApi.deleteReviewLog(id)))
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    await fetchAll()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('部分删除失败')
    }
  } finally {
    deleteLoading.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.review-log-manage {
  padding: 0;
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
  gap: 10px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-item.keyword {
  width: 320px;
}

.filter-item.userId {
  width: 140px;
}

.filter-item.score {
  width: 140px;
}

.filter-item.date {
  width: 280px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 600;
}

.user-id {
  color: #909399;
}

.word {
  font-weight: 600;
}
</style>
