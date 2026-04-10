<template>
  <div class="word-freq-page">
    <el-card class="word-freq-card">
      <div class="toolbar">
        <h2>高频词汇推荐</h2>
        <p class="hint">
          基于系统中全部「english」记录的英文内容（content）统计出现次数（不含已逻辑删除；coreKey 中含「句子信息」的不计入），不拆分、不切割
          content，相同全文合并计数，展示前 100 条。关键词与翻译取该内容首次出现记录中的字段。
        </p>
        <el-button type="primary" :loading="loading" @click="load">刷新数据</el-button>
      </div>

      <el-table
        v-if="!loading && rows.length"
        :data="paginatedRows"
        border
        stripe
        style="width: 100%"
        max-height="640"
      >
        <el-table-column type="index" label="#" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="content" label="英文内容（content）" min-width="260" show-overflow-tooltip />
        <el-table-column prop="coreKey" label="关键词" width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="translation" label="翻译" min-width="200" show-overflow-tooltip />
        <el-table-column prop="count" label="出现次数" width="120" align="center" sortable />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openAddDialog(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="!loading && rows.length"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="rows.length"
        layout="prev, pager, next, jumper, ->, total"
        class="pagination"
        @current-change="handlePageChange"
      />

      <el-empty v-else-if="!loading && !rows.length" description="暂无数据，请先在 English 中添加内容" />
    </el-card>

    <!-- 与 English.vue 一致的新增表单 -->
    <el-dialog v-model="dialogVisible" title="新增内容" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="英文内容">
          <el-input v-model="form.content" type="textarea" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="form.coreKey" />
        </el-form-item>
        <el-form-item label="翻译">
          <el-input v-model="form.translation" type="textarea" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.comment" />
        </el-form-item>
        <el-form-item label="是否熟悉">
          <el-input v-model="form.isTaboo" />
        </el-form-item>
        <el-form-item label="练习次数">
          <el-input v-model="form.textCnt" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="草稿" value="draft" />
            <el-option label="发布" value="published" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEnglish">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import englishApi from '../../api/english'
import reviewApi from '../../api/reviewState'
import type { English } from '../../interface/english'

type FreqItem = { content?: string; coreKey?: string; translation?: string }
type Row = { content: string; count: number; coreKey: string; translation: string }

const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser?.id as number | undefined

const loading = ref(false)
const rows = ref<Row[]>([])
const currentPage = ref(1)
const pageSize = 10

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return rows.value.slice(start, start + pageSize)
})

const dialogVisible = ref(false)
const submitting = ref(false)
const defaultCoreKey = ref('单词')

const form = ref<English>({
  egId: 0,
  userId: userId ?? null,
  content: '',
  coreKey: '',
  translation: '',
  comment: '',
  createDate: '',
  updateDate: '',
  isDeleted: '0',
  status: 'draft',
  isTaboo: 0,
  textCnt: 0,
})

function buildTop100(list: FreqItem[]): Row[] {
  const map = new Map<string, { count: number; coreKey: string; translation: string }>()
  for (const item of list) {
    const content = item.content ?? ''
    if (!content) continue
    const prev = map.get(content)
    if (prev) {
      prev.count += 1
    } else {
      map.set(content, {
        count: 1,
        coreKey: item.coreKey ?? '',
        translation: item.translation ?? '',
      })
    }
  }
  return [...map.entries()]
    .map(([content, v]) => ({
      content,
      count: v.count,
      coreKey: v.coreKey,
      translation: v.translation,
    }))
    .sort((a, b) => b.count - a.count || a.content.localeCompare(b.content))
    .slice(0, 100)
}

const indexMethod = (i: number) => (currentPage.value - 1) * pageSize + i + 1

function handlePageChange(page: number) {
  currentPage.value = page
}

async function load() {
  loading.value = true
  try {
    const res = await englishApi.getAllEnglish()
    const list = (res.data ?? []).filter(
      (item: { isDeleted?: string | number; coreKey?: string }) =>
        String(item.isDeleted) === '0' &&
        !(item.coreKey && String(item.coreKey).includes('句子信息'))
    ) as FreqItem[]
    rows.value = buildTop100(list)
    currentPage.value = 1
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
    rows.value = []
    currentPage.value = 1
  } finally {
    loading.value = false
  }
}

function openAddDialog(row: Row) {
  if (userId == null) {
    ElMessage.warning('请先登录')
    return
  }
  form.value = {
    egId: 0,
    userId: userId,
    content: row.content,
    coreKey: row.coreKey || defaultCoreKey.value,
    translation: row.translation,
    comment: '无',
    createDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    isDeleted: '0',
    status: 'draft',
    isTaboo: 0,
    textCnt: 0,
  }
  dialogVisible.value = true
}

/** 与 English.vue 新增分支一致：addEnglish + 根据 last egId 写 reviewState 并 addReview */
async function submitEnglish() {
  if (userId == null) {
    ElMessage.warning('请先登录')
    return
  }
  submitting.value = true
  try {
    let last: English | undefined
    try {
      const res = await englishApi.getEnglishByuserId(userId)
      const arr = res.data ?? []
      last = arr.length ? arr[arr.length - 1] : undefined
    } catch {
      /* use undefined last */
    }

    defaultCoreKey.value = form.value.coreKey
    await englishApi.addEnglish(form.value)
    ElMessage.success('单词新增成功')

    const v = dayjs().format('YYYY-MM-DD HH:mm:ss')
    // 与 English.vue 新增成功后 reviewState 字段一致
    const reviewState = {
      id: 0,
      userId,
      egId: last?.egId ? last.egId + 1 : 1,
      intervalDays: 0,
      strength: 0,
      difficulty: Math.min(1.0, (form.value.content?.length ?? 0) / 10 * 0.1),
      forgettingIdx: 0,
      repetitions: 0,
      lastReview: v,
      nextReview: v,
      createDate: v,
      updateDate: v,
    }

    await reviewApi.addReview(reviewState)
    ElMessage.success('复习状态新增成功')

    dialogVisible.value = false
  } catch (err) {
    console.error(err)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.word-freq-page {
  padding: 20px;
}

.word-freq-card {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.toolbar h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.hint {
  margin: 0 0 16px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
