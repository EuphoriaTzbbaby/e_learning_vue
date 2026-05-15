<template>
  <div class="ai-reading-page">
    <!-- 顶部介绍 -->
    <div class="hero">
      <div class="hero-left">
        <h2>📖 AI 阅读理解生成器</h2>
        <p>从你复习的词汇中生成精炼英文阅读，配题目与翻译。</p>
      </div>
            <div class="controls">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="date-picker"
        />
      </div>
      <div class="hero-right">
        <el-button type="primary" round @click="loadWords" :loading="loadingWords">
          提取词汇
        </el-button>
        <el-button
          type="success"
          round
          :disabled="!words.length"
          @click="generateReading"
          :loading="generating"
        >
          生成阅读
        </el-button>
      </div>
    </div>

    <!-- 控制面板 -->
    <el-card class="control-card" shadow="hover">

      <transition name="fade">
        <div class="words-info" v-if="words.length">
          <span>🧠 已提取 {{ words.length }} 个词汇（记录日期：{{ selectedDate }}）：</span>
          <div class="chips">
            <el-tag
              v-for="w in words"
              :key="w"
              effect="plain"
              size="small"
              class="chip"
            >
              {{ w }}
            </el-tag>
          </div>
        </div>
      </transition>

      <el-empty v-if="!words.length" description="该日期暂无复习记录" />
    </el-card>

    <!-- 阅读结果 -->
    <transition name="fade">
      <el-card
        v-if="content"
        class="result-card"
        v-loading="generating"
        element-loading-text="正在生成..."
        shadow="always"
      >
        <template #header>
          <div class="card-header">
            <span>📘 阅读结果</span>
            <!-- <div class="actions">
              <el-button size="small" @click="downloadMd" :disabled="!content">下载 Markdown</el-button>
            </div> -->
          </div>
        </template>

        <!-- Markdown 渲染 -->
        <div class="reading-content markdown-body" v-html="htmlContent"></div>
      </el-card>
    </transition>


  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { marked } from 'marked'
import 'github-markdown-css/github-markdown.css'

// 依赖的后端 API
import reviewLogApi from '../../api/reviewLog'
import englishApi from '../../api/english'
import { getDeepSeekResponse } from '../../utils/ds'

/* -------------------- 状态 -------------------- */
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser?.id

const selectedDate = ref<string>(dayjs().format('YYYY-MM-DD'))
const words = ref<string[]>([])
const loadingWords = ref(false)
const generating = ref(false)
const content = ref('')

/* -------------------- Markdown 转 HTML -------------------- */
const htmlContent = computed(() => {
  if (!content.value) return ''
  const res = marked.parse(content.value)
  return typeof res === 'string' ? res : ''
})


/* -------------------- API 与主流程 -------------------- */
const loadWords = async () => {
  if (!selectedDate.value) {
    ElMessage.warning('请先选择日期')
    return
  }
  try {
    loadingWords.value = true
    const res = await reviewLogApi.getReviewLogByUserId(userId)
    const logs: any[] = res?.data || []
    const filteredLogs = logs.filter((log: any) => {
      return dayjs(log.lastReview).format('YYYY-MM-DD') === selectedDate.value
    })

    if (!filteredLogs.length) {
      words.value = []
      ElMessage.info('该日期暂无复习记录')
      return
    }

    const egIds = [...new Set(filteredLogs.map((r: any) => r.egId))]
    const enRes = await englishApi.getEnglishByIds(egIds)
    words.value = (enRes.data || []).map((en: any) => en.content).filter(Boolean)

    ElMessage.success(`已提取 ${words.value.length} 个词汇（${selectedDate.value}）`)
  } catch (e) {
    console.error(e)
    ElMessage.error('提取词汇失败')
  } finally {
    loadingWords.value = false
  }
}


const generateReading = async () => {
  if (!words.value.length) {
    ElMessage.warning('请先提取单词')
    return
  }

  try {
    generating.value = true
    // 限制单词数量，避免 prompt 过长
    const limitedWords = words.value.slice(0, 40)
    const cap = Math.max(80, words.value.length * 4)
    //  中文翻译 (Chinese translation for each paragraph)\n4) 
    const message = `Please generate an English reading comprehension article that naturally includes the following English words: ${limitedWords.join(
      ', '
    )}. Output in Markdown with sections:\n\n1) Title (English)\n2) English Text (the main passage). Total English words should not exceed ${cap} words.\n3) 5 multiple-choice comprehension questions (A-D) in English, followed by an Answers & Explanations section (English answers & one-sentence explanation per question).\n\nRequirements: Except the Chinese translation section, other sections must be entirely in English. Keep language natural and questions distinguishable.`

    const systemPrompt = `You are an English tutoring assistant. Output clean, structured Markdown. Except for the Chinese translation section, everything should be in English. Provide the answer key in this format:\n1) B — Because ...\n2) C — ...`

    const resp = await getDeepSeekResponse(message, systemPrompt)
    content.value = resp || ''
    ElMessage.success('生成完成')
  } catch (e) {
    console.error(e)
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

/* -------------------- 下载 Markdown -------------------- */
// const downloadMd = () => {
//   if (!content.value) return
//   const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = `ai-reading-${selectedDate.value || dayjs().format('YYYY-MM-DD')}.md`
//   a.click()
//   URL.revokeObjectURL(url)
// }

</script>

<style scoped>
.ai-reading-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei';
  color: #333;
}
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(120deg, #f0faff 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 18px 22px;
  box-shadow: 0 6px 18px rgba(20, 40, 80, 0.04);
  margin-bottom: 16px;
}
.hero-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.hero-left p {
  margin: 6px 0 0;
  color: #556;
  font-size: 13px;
}
.hero-right { display: flex; gap: 10px; align-items: center; }

/* 控制卡片 */
.control-card { margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; }
.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.date-picker { width: 160px; }
.words-info { margin-top: 12px; border-top: 1px dashed #eef3f8; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.chips { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.chip { margin-bottom: 6px; }

/* 结果卡片 */
.result-card {
  transition: all 0.28s ease-in-out;
  border-radius: 12px;
  padding: 12px;
}
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.actions { display: flex; gap: 8px; align-items: center; }

/* Markdown 阅读区 — 精美排版 */
.reading-content {
  max-width: 820px;
  margin: 0 auto;
  padding: 16px 8px 24px;
  font-size: 15px;
  line-height: 2;
  color: #24292f;
  font-family: 'Georgia', 'Times New Roman', system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  word-break: break-word;
}

/* 标题层级 — 左侧彩色竖条 + 圆润标题 */
.reading-content h1 {
  font-size: 1.7em;
  font-weight: 800;
  margin: 32px 0 18px;
  padding: 0 0 0 16px;
  border-left: 5px solid #3b82f6;
  border-radius: 0 6px 6px 0;
  line-height: 1.3;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}
.reading-content h2 {
  font-size: 1.35em;
  font-weight: 700;
  margin: 28px 0 14px;
  padding: 0 0 0 14px;
  border-left: 4px solid #8b5cf6;
  border-radius: 0 5px 5px 0;
  line-height: 1.35;
  color: #2d2d44;
}
.reading-content h3 {
  font-size: 1.1em;
  font-weight: 700;
  margin: 20px 0 10px;
  padding: 0 0 0 12px;
  border-left: 3px solid #10b981;
  border-radius: 0 4px 4px 0;
  color: #374151;
}
.reading-content h4, .reading-content h5, .reading-content h6 {
  font-weight: 600;
  margin: 14px 0 8px;
  color: #4b5563;
}

/* 段落 */
.reading-content p {
  margin: 14px 0;
  line-height: 2;
  text-align: justify;
  color: #374151;
}

/* 引用块 — 左侧渐变蓝紫条 */
.reading-content blockquote {
  margin: 20px 0;
  padding: 14px 20px;
  border-left: 4px solid;
  border-image: linear-gradient(180deg, #3b82f6, #8b5cf6) 1;
  background: linear-gradient(135deg, #f8faff 0%, #faf5ff 100%);
  border-radius: 0 8px 8px 0;
  color: #4b5563;
  font-style: italic;
}
.reading-content blockquote p { margin: 0; color: inherit; }

/* 列表 */
.reading-content ul, .reading-content ol {
  margin: 10px 0 14px;
  padding-left: 26px;
}
.reading-content li {
  margin: 6px 0;
  line-height: 1.9;
  color: #374151;
}
.reading-content ul li { list-style-type: disc; }
.reading-content ul li::marker { color: #3b82f6; }
.reading-content ol li { list-style-type: decimal; }
.reading-content ol li::marker { color: #3b82f6; font-weight: 600; }

/* 代码 — 行内 */
.reading-content code {
  background: linear-gradient(135deg, #f1f5f9, #e8edf2);
  color: #be185d;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.88em;
  border: 1px solid #e2e8f0;
}

/* 代码块 — 深色主题 */
.reading-content pre {
  margin: 18px 0;
  padding: 18px 20px;
  background: #1e1e2e;
  border-radius: 10px;
  overflow-x: auto;
  border: 1px solid #2d2d3a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  position: relative;
}
.reading-content pre code {
  background: transparent;
  color: #cdd6f4;
  padding: 0;
  border: none;
  border-radius: 0;
  font-size: 0.9em;
  line-height: 1.7;
  border: none;
  box-shadow: none;
}

/* 表格 — 圆角卡片风格 */
.reading-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}
.reading-content th {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  font-weight: 600;
  padding: 11px 16px;
  text-align: left;
  font-size: 0.9em;
  letter-spacing: 0.3px;
}
.reading-content td {
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.92em;
}
.reading-content tr:last-child td { border-bottom: none; }
.reading-content tr:nth-child(even) { background: #f9fafb; }
.reading-content tr:hover { background: #f0f5ff; }

/* 分隔线 */
.reading-content hr {
  margin: 28px 0;
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d1d5db, transparent);
  border-radius: 2px;
}

/* 图片 */
.reading-content img {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  margin: 12px 0;
}

/* 链接 */
.reading-content a {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}
.reading-content a:hover {
  border-bottom-color: #3b82f6;
}

/* 加粗/斜体 */
.reading-content strong { color: #1f2937; font-weight: 700; }
.reading-content em { color: #6b7280; font-style: italic; }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 响应式 */
@media (max-width: 900px) {
  .hero { flex-direction: column; gap: 12px; align-items: flex-start; }
}
</style>