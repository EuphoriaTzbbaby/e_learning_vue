<template>
  <div class="study-page" v-loading="loading">
    <!-- 进度条 -->
    <transition name="fade">
      <div class="progress-bar" v-if="!loading && total > 0">
        <el-progress :percentage="progress" stroke-width="14" :show-text="false" status="success" />
        <p class="progress-text">{{ done }}/{{ total }} 已完成</p>
      </div>
    </transition>

    <!-- 骨架屏 -->
    <div v-if="loading" class="skeleton-wrapper">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 学习卡片 -->
    <transition name="slide-fade" mode="out-in">
      <div v-if="!finished && current" :key="current.id" class="card">
        <!-- 单词 -->
        <h2 class="term">{{ current.english?.coreKey ?? '' }}</h2>

        <!-- 例句 -->
        <p class="sentence">{{ current.english?.content ?? '' }}</p>

        <!-- 翻译区 -->
        <div class="meaning">
          <el-button
            v-if="!revealed"
            type="primary"
            round
            @click="revealed = true"
          >
            显示翻译 (空格)
          </el-button>
          <transition name="fade">
            <p v-if="revealed" class="translation">{{ current.english?.translation ?? '' }}</p>
          </transition>
        </div>

        <!-- 评分按钮 -->
        <div class="options">
        <el-button
            v-for="(_, label) in SCORE_MAP"
            :key="label"
            :type="getButtonType(label)"
            round
            class="option-btn"
            :loading="rating"
            @click="rate(label)"
        >
            {{ label }}
        </el-button>
        </div>


        <!-- 快捷键提示 -->
        <div class="shortcut-hint">
          <span class="hint-tag">1 = 熟悉</span>
          <span class="hint-tag">2 = 认识</span>
          <span class="hint-tag">3 = 模糊</span>
          <span class="hint-tag">4 = 不认识</span>
          <span class="hint-tag">空格 = 翻译</span>
        </div>
      </div>
    </transition>

    <transition name="fade">
    <div v-show="finished" class="finished">
        <el-result
        icon="success"
        title="🎉 本轮复习完成"
        sub-title="你已完成所有待复习的单词"
        >
        <template #extra>
            <el-button type="primary" round size="large" @click="restart">再来一遍</el-button>
            <el-button round size="large" @click="goBack">返回</el-button>
        </template>
        </el-result>
    </div>
    </transition>


  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import reviewApi from '../../api/reviewState';
import englishApi from '../../api/english';
import reviewLogApi from '../../api/reviewLog';
import type { ReviewLog } from '../../interface/reviewLog';
import type { English } from '../../interface/english';
import type { ReviewState } from '../../interface/reviewState';
import { sm5Update } from '../../utils/sm5';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
const router = useRouter();
// 获取用户信息(已存储到浏览器中)
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null;
const userId = currentUser.id;
// 
export interface ReviewStateWithEnglish extends ReviewState {
  english: English;
}
const reviewLog = ref<ReviewLog>({
  logId: 0,
  userId: userId,
  egId: 0,
  score: 0,
  lastReview: dayjs().format('YYYY-MM-DD HH:mm:ss'),
});
const list = ref<ReviewStateWithEnglish[]>([]);
const idx = ref(0);
const loading = ref(false);
const rating = ref(false);
const revealed = ref(false);
const finished = ref(false);

const total = computed(() => list.value.length);
const done = computed(() => Math.min(idx.value, total.value));
const progress = computed(() => (total.value ? Math.floor((done.value / total.value) * 100) : 0));
const current = computed<ReviewStateWithEnglish | null>(() => list.value[idx.value] ?? null);

// 四个选项映射分数
const SCORE_MAP: Record<'熟悉' | '认识' | '模糊' | '不认识', number> = {
  熟悉: 5,
  认识: 4,
  模糊: 2,
  不认识: 0,
};

// ====== 获取待复习列表 ======
async function fetchDue() {
  loading.value = true;
  try {
    const res = await reviewApi.getAllReviews(userId);
    const reviews: ReviewStateWithEnglish[] = res?.data ?? [];
    if (!reviews.length) {
      list.value = [];
      return;
    }
    // 过滤出未完成的复习记录
    let v = dayjs().format("YYYY-MM-DD HH:mm:ss");
    console.log(v, reviews[0].nextReview)
    const unfinishedReviews = reviews.filter((r) => r.nextReview <= v);
    if (!unfinishedReviews.length) {
      list.value = [];
      return;
    }
    unfinishedReviews.sort((a, b) => {
      return dayjs(b.nextReview).unix() - dayjs(a.nextReview).unix();
    })
    console.log(unfinishedReviews, 0);
    const egIds = unfinishedReviews.map((r) => r.egId);
    const enRes = await englishApi.getEnglishByIds(egIds);
    const enMap = new Map<number, English>();
    (enRes.data as English[]).forEach((en) => enMap.set(en.egId, en));

    list.value = unfinishedReviews.map((r) => {
      const english = enMap.get(r.egId);
      if (!english) {
        throw new Error(`找不到ID为 ${r.egId} 的英语内容`);
      }
      return { ...r, english };
    });
    console.log(list.value, 1111);
  } catch (e) {
    ElMessage.error('获取待复习列表失败');
  } finally {
    loading.value = false;
  }
}

// ====== 打分 ======
async function rate(choice: '熟悉' | '认识' | '模糊' | '不认识') {
  if (!current.value) return;
  rating.value = true;
  try {
    await update(current.value, SCORE_MAP[choice])
    revealed.value = false;
    idx.value += 1;
    if (idx.value >= total.value) {
      finished.value = true;
      ElMessage.success('本轮复习完成');
    }
  } catch (e) {
    ElMessage.error('提交打分失败，请重试');
  } finally {
    rating.value = false;
  }
}
const update = async (reviewState: ReviewState, score: number) => {
  rating.value = true
  try {
    // 1. 使用 SM-5 算法更新复习状态
    reviewState = sm5Update(reviewState, score)

    // 2. 更新时间
    let v = dayjs();
    reviewState.lastReview = v.format("YYYY-MM-DD HH:mm:ss")
    reviewState.updateDate = v.format("YYYY-MM-DD HH:mm:ss")
    reviewState.nextReview = v.add(reviewState.intervalDays, 'day').format("YYYY-MM-DD HH:mm:ss")
    // 3. 提交到后端
    await reviewApi.updateReview(reviewState)

    ElMessage.success("复习状态已更新")
    // 4. 提交到后端
    reviewLog.value.egId = reviewState.egId;
    reviewLog.value.score = score;
    reviewLog.value.lastReview = v.format("YYYY-MM-DD HH:mm:ss")
    await reviewLogApi.addReviewLog(reviewLog.value)
  } catch (e) {
    ElMessage.error("更新失败")
  } finally {
    rating.value = false
  }
}

// ====== 键盘操作 ======
function onKey(e: KeyboardEvent) {
  if (finished.value) return;
  if (e.key === '1') rate('熟悉');
  else if (e.key === '2') rate('认识');
  else if (e.key === '3') rate('模糊');
  else if (e.key === '4') rate('不认识');
  else if (e.key === ' ') revealed.value = !revealed.value;
}

function restart() {
  idx.value = 0;
  finished.value = false;
  revealed.value = false;
}

function goBack() {
    router.back();
}
// 在 <script setup> 里加：
function getButtonType(label: string) {
  switch (label) {
    case '熟悉':
      return 'success'; // 绿色
    case '认识':
      return 'primary'; // 蓝色
    case '模糊':
      return 'warning'; // 橙色
    case '不认识':
      return 'danger';  // 红色
    default:
      return 'info';
  }
}
onMounted(() => {
  fetchDue();
  window.addEventListener('keydown', onKey);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
.study-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.3); /* 半透明 */
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  border-radius: 20px;
}


.progress-bar {
  margin-bottom: 20px;
  text-align: center;
}
.progress-text {
  margin-top: 5px;
  font-size: 14px;
  color: #666;
}

.card {
  padding: 30px 20px;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  background: #fff;
  text-align: center;
  transition: all 0.3s ease;
}

.term {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.sentence {
  font-size: 18px;
  margin-bottom: 20px;
  color: #555;
  font-style: italic;
}

.meaning {
  margin: 20px 0;
}
.translation {
  font-size: 20px;
  color: #222;
  margin-top: 12px;
}

.options {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  flex-wrap: wrap;
  gap: 12px;
}
.option-btn {
  min-width: 100px;
  transition: transform 0.2s;
}
.option-btn:hover {
  transform: scale(1.05);
}

.shortcut-hint {
  margin-top: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.hint-tag {
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: #555;
}

.finished {
  margin-top: 50px;
  text-align: center;
}

.skeleton-wrapper {
  padding: 20px;
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.slide-fade-enter-active {
  transition: all 0.4s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
