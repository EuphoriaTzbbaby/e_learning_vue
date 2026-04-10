<template>
  <div class="ai-reading-page">
    <!-- 顶部介绍 -->
    <div class="hero">
      <div class="hero-left">
        <h2>📖 AI 阅读理解生成器</h2>
        <p>智能从你复习的单词中生成精炼英文阅读，配题目与翻译。</p>
      </div>
      <div class="hero-right">
        <el-button type="primary" round @click="loadWords" :loading="loadingWords">
          提取单词
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
      <div class="controls">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择复习日期"
          style="width: 200px;"
        />
        <el-radio-group v-model="dateType" size="small">
          <el-radio-button label="last">实际复习</el-radio-button>
          <el-radio-button label="next">计划复习</el-radio-button>
        </el-radio-group>

        <el-tooltip content="从复习记录中提取词汇" placement="top">
          <el-button icon="Search" :loading="loadingWords" @click="loadWords">提取</el-button>
        </el-tooltip>
        <el-tooltip content="自动生成阅读理解" placement="top">
          <el-button
            icon="Document"
            type="success"
            :disabled="!words.length"
            :loading="generating"
            @click="generateReading"
          >
            生成
          </el-button>
        </el-tooltip>

        <el-dropdown v-if="words.length" trigger="click" @command="onWordsMenu">
          <el-button plain>
            单词操作
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="copy">复制词表</el-dropdown-item>
            <el-dropdown-item command="clear">清空</el-dropdown-item>
            <el-dropdown-item command="save">保存为本地历史</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <transition name="fade">
        <div class="words-info" v-if="words.length">
          <span>🧠 提取 {{ words.length }} 个词汇：</span>
          <div class="chips">
            <el-tag
              v-for="w in words"
              :key="w"
              effect="plain"
              size="small"
              class="chip"
              @click="showWordMeaning(w)"
            >
              {{ w }}
            </el-tag>
          </div>
          <div class="word-stats">
            <small>（显示前 {{ words.length > 40 ? 40 : words.length }} 个；词频统计见下方）</small>
          </div>
        </div>
      </transition>

      <el-empty v-if="!words.length" description="尚未提取到词汇" />
    </el-card>

    <!-- 阅读结果 -->
    <transition name="fade">
      <el-card
        v-if="content"
        ref="resultCard"
        class="result-card"
        v-loading="generating"
        element-loading-text="正在生成..."
        shadow="always"
      >
        <template #header>
          <div class="card-header">
            <span>📘 阅读结果</span>
            <div class="actions">
              <el-button size="small" @click="copyContent" :disabled="!content">复制</el-button>
              <el-button size="small" @click="downloadMd" :disabled="!content">下载 Markdown</el-button>
              <el-button size="small" @click="exportPDF" :disabled="!content">导出 PDF</el-button>
              <el-button size="small" @click="regenerate" :disabled="!words.length">重新生成</el-button>
              <el-radio-group v-model="renderMode" size="small">
                <el-radio-button label="structured">结构化</el-radio-button>
                <el-radio-button label="markdown">Markdown</el-radio-button>
              </el-radio-group>
              <el-button size="small" @click="toggleChinese" :disabled="renderMode === 'markdown'">
                {{ showChinese ? '隐藏中文' : '显示中文' }}
              </el-button>
            </div>
          </div>
        </template>

        <!-- 渲染阅读内容 -->
        <div v-if="renderMode === 'structured'" class="structured">
          <div class="split" :class="{ single: !showChinese }">
            <el-card class="pane" shadow="never">
              <template #header><b>English Text</b></template>
              <div class="article reading-area" v-html="highlightedEnglish"></div>

              <div class="controls-bottom">
                <el-button size="small" @click="speakEnglish" :disabled="!englishText">朗读</el-button>
                <el-button size="small" @click="toggleAllMarks">切换标注</el-button>
                <el-popover
                  placement="top-start"
                  width="260"
                  v-model:visible="showWordPopover"
                >
                  <div class="word-meaning">
                    <div v-if="activeWord">
                      <h4>{{ activeWord }}</h4>
                      <p v-if="wordMeaning[activeWord]">{{ wordMeaning[activeWord] }}</p>
                      <p v-else><small>暂无释义（可接入词典 API 获取）</small></p>
                    </div>
                  </div>
                  <template #reference>
                    <el-button size="mini" type="text" v-if="activeWord">释义</el-button>
                  </template>
                </el-popover>
              </div>
            </el-card>

            <el-card v-if="showChinese" class="pane" shadow="never">
              <template #header><b>中文翻译</b></template>
              <div class="article cn" v-html="toHtml(chineseText)"></div>
            </el-card>
          </div>

          <el-card class="qa-block" shadow="never">
            <template #header><b>Reading Comprehension</b></template>
            <transition-group name="slide-fade" tag="div">
              <div class="question" v-for="(q, idx) in questions" :key="idx">
                <div class="stem">{{ idx + 1 }}. {{ q.stem }}</div>
                <el-radio-group v-model="userAnswers[idx]" class="options">
                  <el-radio v-for="opt in q.options" :key="opt.key" :label="opt.key">
                    <span class="opt-key">{{ opt.key }}.</span> {{ opt.text }}
                  </el-radio>
                </el-radio-group>

                <div class="selection-status" v-if="userAnswers[idx]">
                  <span :class="isCorrect(idx) ? 'correct' : 'incorrect'">
                    {{ isCorrect(idx) ? '✅ 正确' : '❌ 错误' }}
                  </span>
                </div>

                <div class="feedback" v-if="showCorrect">
                  正确答案：<b>{{ answers[idx + 1] || '-' }}</b>
                  <span v-if="userAnswers[idx]">，你的选择：{{ userAnswers[idx] }}</span>
                  <div class="explain" v-if="explanations[idx + 1]">解析：{{ explanations[idx + 1] }}</div>
                </div>
              </div>
            </transition-group>

            <div class="qa-actions">
              <el-switch v-model="showCorrect" active-text="显示正确答案" inactive-text="隐藏正确答案" />
              <el-button size="small" @click="clearSelections">清空选择</el-button>
              <el-button size="small" @click="toggleAllExplanations">切换解析显示</el-button>
            </div>
          </el-card>

          <!-- 词频统计 -->
          <el-card class="freq-card" shadow="never">
            <template #header><b>词频统计</b></template>
            <div v-if="wordFreqList.length">
              <div class="freq-row" v-for="w in wordFreqList" :key="w.word">
                <span class="wf-word">{{ w.word }}</span>
                <span class="wf-count">{{ w.count }}</span>
              </div>
            </div>
            <div v-else><small>暂无词频统计。</small></div>
          </el-card>
        </div>

        <!-- Markdown 视图 -->
        <div v-else-if="renderMode === 'markdown'" class="reading-content markdown-body" v-html="htmlContent"></div>
      </el-card>
    </transition>

    <el-dialog v-model="showMeaningDialog" title="单词释义" width="420px">
      <div v-if="meaningDialogWord">
        <h3>{{ meaningDialogWord }}</h3>
        <p v-if="meaningDialogText">{{ meaningDialogText }}</p>
        <p v-else><small>暂无释义，建议接入词典 API（有道/牛津/词典）以获得更准确释义。</small></p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showMeaningDialog = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * AiReadingPage.vue
 * 完整实现（TypeScript + script setup）
 *
 * 说明：
 * - 保留并扩展了你原有功能（loadWords、generateReading、parseSections、解析题目、复制、下载MD等）。
 * - 新增：导出 PDF（html2canvas + jspdf 示例）、朗读（浏览器 TTS）、单词释义弹窗占位、词频统计、重新生成按钮等。
 */

import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'github-markdown-css/github-markdown.css'
import 'highlight.js/styles/github.css'

// 依赖的后端 API（保持你原来的封装）
import reviewApi from '../../api/reviewState'
import englishApi from '../../api/english'
import { getDeepSeekResponse } from '../../utils/ds'

// PDF 导出库（请安装： html2canvas jspdf ）
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/* -------------------- 状态 -------------------- */
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser?.id

const selectedDate = ref<string>('')
const dateType = ref<'last' | 'next'>('last')
const words = ref<string[]>([])
const loadingWords = ref(false)
const generating = ref(false)
const content = ref('')
const renderMode = ref<'structured' | 'markdown'>('structured')

// 解析后的结构
const englishText = ref('')
const chineseText = ref('')
const showChinese = ref(true)
const highlightedOn = ref(true)

type Option = { key: 'A' | 'B' | 'C' | 'D'; text: string }
type Question = { stem: string; options: Option[] }
const questions = ref<Question[]>([])
const answers = ref<Record<number, string>>({})
const explanations = ref<Record<number, string>>({})
const userAnswers = ref<Record<number, string>>({})
const showCorrect = ref(false)

// UI 状态
const showMeaningDialog = ref(false)
const meaningDialogWord = ref<string>('')
const meaningDialogText = ref<string>('')
const wordMeaning = ref<Record<string, string>>({})
const activeWord = ref<string>('')
const showWordPopover = ref(false)
const resultCard = ref<HTMLElement | null>(null)

/* -------------------- 工具函数 -------------------- */
const toHtml = (txt: string) => {
  if (!txt) return ''
  const res = marked.parse(txt)
  return typeof res === 'string' ? res : ''
}
const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 将 Markdown 转为 HTML（备用）
const htmlContent = computed(() => {
  if (!content.value) return ''
  const res = marked.parse(content.value)
  return typeof res === 'string' ? res : ''
})

/* -------------------- 高亮英文正文并标注单词 -------------------- */
const highlightedEnglish = computed(() => {
  if (!englishText.value) return ''
  let html = englishText.value
  if (highlightedOn.value && words.value.length) {
    // 为避免替换 HTML 标签内部内容，简单方式：按单词边界替换（可能不足以避免所有 edge case）
    words.value.forEach((w) => {
      if (!w) return
      // 只高亮字母/数字组合（忽略空串）
      const re = new RegExp(`\\b${escapeReg(w)}\\b`, 'gi')
      html = html.replace(re, (m) => `<mark class="word-mark" data-word="${m}">${m}</mark>`)
    })
    // 给 mark 添加点击能力（下一 tick 添加事件代理）
    nextTick(() => {
      document.querySelectorAll('.word-mark').forEach((el) => {
        (el as HTMLElement).onclick = () => {
          const w = (el as HTMLElement).dataset.word || ''
          if (w) showWordMeaning(w)
        }
      })
    })
  }
  return toHtml(html)
})

/* -------------------- 解析 Markdown 为结构化区域 -------------------- */
const parseSections = (md: string) => {
  const getSectionByCandidates = (candidates: string[]) => {
    const alt = candidates.map(escapeReg).join('|')
    const re = new RegExp(`^#{1,6}\\s*(?:${alt})\\s*(?:[:：—-]*)\\s*$`, 'im')
    const match = md.match(re)
    if (!match) return ''
    const start = match.index! + match[0].length
    const rest = md.slice(start)
    const nextIdx = rest.search(/^#{1,6}\s+.+$/m)
    return nextIdx >= 0 ? rest.slice(0, nextIdx).trim() : rest.trim()
  }

  englishText.value = getSectionByCandidates(['English Text', 'English', '正文（English）', '正文', 'Article'])
  chineseText.value = getSectionByCandidates(['中文翻译', 'Chinese Translation', 'Translation', '译文', '中文'])
  const qText = getSectionByCandidates(['Reading Comprehension Questions', 'Reading Comprehension', 'Comprehension Questions', 'Questions', '阅读理解题目', '题目'])
  const aText = getSectionByCandidates(['Answers and Explanations', 'Answers & Explanations', 'Answer & Explanation', 'Answers', 'Answer Key', '参考答案', '答案', '解析'])

  // Fallback: 若英文未命中标题，尝试取中文/题目前的内容作为英文正文
  if (!englishText.value) {
    const chRe = new RegExp(`^#{1,6}\\s*(?:${['中文翻译', 'Chinese Translation', 'Translation', '译文', '中文'].map(escapeReg).join('|')})\\s*(?:[:：—-]*)\\s*$`, 'im')
    const chMatch = md.match(chRe)
    const endIdx = chMatch?.index ?? -1
    const pre = endIdx >= 0 ? md.slice(0, endIdx) : md
    englishText.value = pre.replace(/^#{1,6}\s+.*$/gm, '').trim()
  }

  // 解析题目文本（优先使用 qText，否则根据答案前后截取）
  let qTextWork = qText
  if (!qTextWork) {
    const qRe = new RegExp(`^#{1,6}\\s*(?:${['Reading Comprehension Questions', 'Reading Comprehension', 'Comprehension Questions', 'Questions', '阅读理解题目', '题目'].map(escapeReg).join('|')})\\s*(?:[:：—-]*)\\s*$`, 'im')
    const aRe = new RegExp(`^#{1,6}\\s*(?:${['Answers and Explanations', 'Answers & Explanations', 'Answer & Explanation', 'Answers', 'Answer Key', '参考答案', '答案', '解析'].map(escapeReg).join('|')})\\s*(?:[:：—-]*)\\s*$`, 'im')
    const qm = md.match(qRe)
    const am = md.match(aRe)
    if (qm) {
      const start = qm.index! + qm[0].length
      const end = am ? am.index! : md.length
      qTextWork = md.slice(start, end).trim()
    }
  }

  // 解析题目
  const lines = (qTextWork || qText || '').split('\n')
  const qs: Question[] = []
  let current: Question | null = null
  for (const line of lines) {
    const qMatch = line.match(/^\s*(\d+)[\.\)]\s*(.+)$/)
    const oMatch = line.match(/^\s*([A-D])[\.\)]\s*(.+)$/)
    if (qMatch) {
      if (current) qs.push(current)
      current = { stem: qMatch[2].trim(), options: [] }
    } else if (oMatch && current) {
      current.options.push({ key: oMatch[1] as Option['key'], text: oMatch[2].trim() })
    }
  }
  if (current) qs.push(current)
  questions.value = qs

  // 解析答案（支持 "1) B — Because ..." 格式）
  const ans: Record<number, string> = {}
  explanations.value = {}
  if (aText) {
    for (const m of aText.matchAll(/(\d+)\s*[\.\)]\s*([A-D])(?:\s*(?:—|-|:)\s*(.+))?/gi)) {
      const idx = Number(m[1])
      ans[idx] = m[2].toUpperCase()
      if (m[3]) explanations.value[idx] = m[3].trim()
    }
    if (!Object.keys(ans).length) {
      aText.split('\n').forEach((l) => {
        const m = l.match(/(\d+)\s*[\.\)]\s*([A-D])(?:\s*(?:—|-|:)\s*(.+))?/i)
        if (m) {
          const idx = Number(m[1])
          ans[idx] = m[2].toUpperCase()
          if (m[3]) explanations.value[idx] = m[3].trim()
        }
      })
    }
  }
  answers.value = ans
}

/* -------------------- API 与主流程 -------------------- */
const loadWords = async () => {
  if (!selectedDate.value) {
    ElMessage.warning('请先选择日期')
    return
  }
  try {
    loadingWords.value = true
    const res = await reviewApi.getAllReviews(userId)
    const reviews: any[] = res?.data || []
    const filtered = reviews.filter((r: any) => {
      const day = dayjs(dateType.value === 'last' ? r.lastReview : r.nextReview).format('YYYY-MM-DD')
      return day === selectedDate.value
    })

    if (!filtered.length) {
      words.value = []
      ElMessage.info('该日期没有匹配的复习记录')
      return
    }

    const egIds = filtered.map((r) => r.egId)
    const enRes = await englishApi.getEnglishByIds(egIds)
    words.value = (enRes.data || []).map((en: any) => en.content).filter(Boolean)

    // 词频缓存清空
    computeWordFreq()
    ElMessage.success(`已提取 ${words.value.length} 个单词`)
  } catch (e) {
    console.error(e)
    ElMessage.error('提取词汇失败')
  } finally {
    loadingWords.value = false
  }
}

const regenerate = async () => {
  // 重新生成一次（调用生成逻辑）
  await generateReading(true)
}

const generateReading = async (isRegenerate = false) => {
  if (!words.value.length) {
    ElMessage.warning('请先提取单词')
    return
  }

  try {
    generating.value = true
    // 限制单词数量，避免 prompt 过长
    const limitedWords = words.value.slice(0, 40)
    const cap = Math.max(80, words.value.length * 4)
    const message = `Please generate an English reading comprehension article that naturally includes the following English words: ${limitedWords.join(
      ', '
    )}. Output in Markdown with sections:\n\n1) Title (English)\n2) English Text (the main passage). Total English words should not exceed ${cap} words.\n3) 中文翻译 (Chinese translation for each paragraph)\n4) 5 multiple-choice comprehension questions (A-D) in English, followed by an Answers & Explanations section (English answers & one-sentence explanation per question).\n\nRequirements: Except the Chinese translation section, other sections must be entirely in English. Keep language natural and questions distinguishable.`

    const systemPrompt = `You are an English tutoring assistant. Output clean, structured Markdown. Except for the Chinese translation section, everything should be in English. Provide the answer key in this format:\n1) B — Because ...\n2) C — ...`

    const resp = await getDeepSeekResponse(message, systemPrompt)
    // 假设 getDeepSeekResponse 返回字符串 Markdown
    content.value = resp || ''
    parseSections(content.value)

    // 词数检查
    const wc = countEnglishWords(englishText.value)
    if (wc > cap) {
      ElMessage.info(`英文词数 ${wc} 超过上限 ${cap}，正在自动精简…`)
      const message2 = message + ` Please strictly limit the English text to ${cap} words. Compress without changing the main structure or core information.`
      const resp2 = await getDeepSeekResponse(message2, systemPrompt)
      content.value = resp2 || content.value
      parseSections(content.value)
    }

    // 解析完后生成词频
    computeWordFreq()
    // 高亮渲染
    await nextTick()
    highlightCodeBlocks()
    ElMessage.success(isRegenerate ? '重新生成完成' : '生成完成')
  } catch (e) {
    console.error(e)
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

/* -------------------- 词频统计 -------------------- */
const computeWordFreq = () => {
  const txt = englishText.value || content.value || ''
  const arr = txt.toLowerCase().match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g) || []
  const freq: Record<string, number> = {}
  for (const w of arr) {
    freq[w] = (freq[w] || 0) + 1
  }
  // 优先显示提取词汇的频次
  const list = words.value
    .slice(0, 200)
    .map((w) => ({ word: w, count: freq[w.toLowerCase()] || 0 }))
    .sort((a, b) => b.count - a.count)
  wordFreqList.value = list
}
const wordFreqList = ref<{ word: string; count: number }[]>([])

/* -------------------- 高亮代码块（Markdown 中的 code） -------------------- */
const highlightCodeBlocks = () => {
  document.querySelectorAll('.reading-content pre code').forEach((el) => {
    try {
      hljs.highlightElement(el as HTMLElement)
    } catch {}
  })
}

/* -------------------- 复制 / 下载 / 导出 PDF -------------------- */
const copyContent = async () => {
  if (!content.value) return
  try {
    await navigator.clipboard.writeText(content.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const downloadMd = () => {
  if (!content.value) return
  const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-reading-${selectedDate.value || dayjs().format('YYYY-MM-DD')}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// 导出 PDF（html2canvas + jsPDF）
const exportPDF = async () => {
  try {
    const el = (resultCard.value as HTMLElement) || document.querySelector('.result-card')!
    if (!el) throw new Error('未找到结果区域')
    ElMessage.info('正在导出 PDF，请稍候...')
    // 将元素转成 canvas（提高 scale 可提升清晰度）
    const canvas = await html2canvas(el as HTMLElement, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    // 计算图像打印尺寸
    const imgProps = (pdf as any).getImageProperties(imgData)
    const imgWidth = pageWidth
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    pdf.save(`ai-reading-${selectedDate.value || dayjs().format('YYYY-MM-DD')}.pdf`)
    ElMessage.success('PDF 导出成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('PDF 导出失败（请检查依赖或打印权限）')
  }
}

/* -------------------- 辅助：统计英文词数 -------------------- */
const countEnglishWords = (txt: string) => {
  const arr = txt.toLowerCase().match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g)
  return arr ? arr.length : 0
}

/* -------------------- 单词释义（占位） -------------------- */
const showWordMeaning = (w: string) => {
  if (!w) return
  // 优先使用缓存
  activeWord.value = w
  if (wordMeaning.value[w]) {
    meaningDialogWord.value = w
    meaningDialogText.value = wordMeaning.value[w]
    showMeaningDialog.value = true
    return
  }
  // 占位：如果你接入词典 API，在这里调用并保存结果
  // 示例：调用有道/牛津 API，取释义并赋给 wordMeaning.value[w]
  meaningDialogWord.value = w
  meaningDialogText.value = ''
  showMeaningDialog.value = true
  // 模拟请求（可以替换为真实接口）
  setTimeout(() => {
    // 示例假释义（可替换）
    const fake = `Definition of ${w} (示例释义) — replace with real dictionary API response.`
    wordMeaning.value[w] = fake
    meaningDialogText.value = fake
  }, 400)
}

/* -------------------- 朗读（浏览器 TTS） -------------------- */
const speakEnglish = () => {
  const txt = (englishText.value || '').replace(/\n{2,}/g, '\n')
  if (!txt) {
    ElMessage.info('没有可朗读的英文文本')
    return
  }
  try {
    const u = new SpeechSynthesisUtterance(txt)
    // 选择语音（各浏览器可用语音不同）
    u.lang = 'en-US'
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  } catch (e) {
    console.error(e)
    ElMessage.error('朗读失败')
  }
}

/* -------------------- 其他 UI 控件 -------------------- */
const toggleChinese = () => (showChinese.value = !showChinese.value)
const toggleAllMarks = () => (highlightedOn.value = !highlightedOn.value)

const clearSelections = () => {
  userAnswers.value = {}
}
const toggleAllExplanations = () => {
  showCorrect.value = !showCorrect.value
}

/* -------------------- 判定答题是否正确 -------------------- */
const isCorrect = (idx: number) => {
  const chosen = (userAnswers.value[idx] || '').toUpperCase()
  const correct = (answers.value[idx + 1] || '').toUpperCase()
  return !!chosen && !!correct && chosen === correct
}

/* -------------------- 词表菜单 -------------------- */
const onWordsMenu = (cmd: string) => {
  if (cmd === 'copy') {
    navigator.clipboard.writeText(words.value.join(', ')).then(() => {
      ElMessage.success('已复制词表')
    })
  } else if (cmd === 'clear') {
    words.value = []
    wordFreqList.value = []
    ElMessage.info('已清空词表')
  } else if (cmd === 'save') {
    const hist = JSON.parse(localStorage.getItem('aiReadingHistory' ) || '[]')
    hist.unshift({ date: new Date().toISOString(), words: words.value.slice() })
    localStorage.setItem('aiReadingHistory', JSON.stringify(hist.slice(0, 50)))
    ElMessage.success('已保存到本地历史')
  }
}

/* -------------------- 监听 content 以高亮代码块 -------------------- */
watch(content, async (val) => {
  if (!val) return
  await nextTick()
  highlightCodeBlocks()
})

/* -------------------- 初始化 -------------------- */
onMounted(() => {
  // 如果本地有默认日期/用户设置可以在此读取
})
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
.words-info { margin-top: 12px; border-top: 1px dashed #eef3f8; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.chips { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.chip { margin-bottom: 6px; cursor: pointer; transition: transform .12s ease, background .12s ease; }
.chip:hover { transform: translateY(-3px); background: #ecf8ff; color: #1890ff; }

/* 结果卡片 */
.result-card {
  transition: all 0.28s ease-in-out;
  border-radius: 12px;
  padding: 12px;
}
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.actions { display: flex; gap: 8px; align-items: center; }

/* Markdown 基础样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  padding: 12px;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  margin: 12px 0 8px;
}
.markdown-body p { margin: 8px 0; }
.markdown-body ul, .markdown-body ol { padding-left: 20px; }
.markdown-body code { background: #f6f8fa; padding: 2px 4px; border-radius: 4px; }
.markdown-body pre { background: #f6f8fa; padding: 12px; border-radius: 8px; overflow: auto; }

/* 结构化视图样式 */
.structured { display: grid; gap: 16px; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.split.single { grid-template-columns: 1fr; }
.pane .article { white-space: pre-wrap; font-size: 15px; line-height: 1.8; padding: 8px; max-height: 420px; overflow: auto; }
.pane .article.cn { font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei'; }

/* 阅读区工具 */
.controls-bottom { display: flex; gap: 8px; align-items: center; margin-top: 8px; }

/* 题目样式 */
.question { padding: 10px 0; border-bottom: 1px dashed #eee; }
.stem { font-weight: 600; margin-bottom: 8px; }
.options { display: grid; grid-template-columns: 1fr; gap: 6px; margin-top: 8px; }
.opt-key { display: inline-block; width: 20px; color: #666; }
.feedback { margin-top: 6px; color: #409eff; }
.selection-status { margin-top: 6px; }
.correct { color: #67C23A; }
.incorrect { color: #F56C6C; }
.explain { margin-top: 4px; color: #606266; }
.qa-actions { display: flex; gap: 12px; margin-top: 12px; }

/* 词频统计 */
.freq-card { margin-top: 8px; }
.freq-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f3f6f9; }
.wf-word { font-weight: 600; }
.wf-count { color: #888; }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-fade-enter-active { transition: all .25s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(8px); }

/* mark 样式 */
.word-mark { background: linear-gradient(90deg, rgba(250,240,210,0.9), rgba(255,245,210,0.9)); padding: 0 2px; border-radius: 3px; cursor: pointer; }

/* 响应式 */
@media (max-width: 900px) {
  .split { grid-template-columns: 1fr; }
  .hero { flex-direction: column; gap: 12px; align-items: flex-start; }
}
</style>
