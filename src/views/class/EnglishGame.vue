<template>
  <div class="spelling-game-page">
    <el-card class="game-card">
      <div class="game-header">
        <h2>🧠 单词拼拼看</h2>

        <div style="display: flex; gap: 10px; align-items: center">
          <el-select
            v-model="coreKeyFilter"
            placeholder="选择关键词"
            size="small"
            style="min-width: 130px"
          >
            <el-option
              v-for="key in coreKeyOptions"
              :key="key"
              :label="key === 'all' ? '全部词库' : key"
              :value="key"
            />
          </el-select>

          <el-tag type="success" effect="dark">连续答对：{{ streak }} 次</el-tag>
          
        </div>
      </div>

      <el-form-item label="拼写方式：" style="margin-bottom: 10px">
        <el-radio-group v-model="mode">
          <el-radio label="select">选择字母</el-radio>
          <el-radio label="input">键盘输入</el-radio>
        </el-radio-group>
      </el-form-item>
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑内容' : '新增内容'" width="600px">
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
        <el-button type="primary" @click="submitEnglish">{{ isEditMode ? '保存修改' : '确定' }}</el-button>
      </template>
    </el-dialog>
      <div v-if="currentWord">
        <p>
          提示关键词：<b>{{ currentWord.coreKey }}</b><br />
          翻译：{{ currentWord.translation }}<br />
          已练习：{{ currentWord.textCnt }} 🐔次
        </p>

        <div v-if="mode === 'select'" class="letters">
          <el-button
            v-for="(letter, index) in shuffledLetters"
            :key="index"
            @click="selectLetter(index)"
            :type="usedIndices.includes(index) ? 'danger' : 'default'"
            :plain="usedIndices.includes(index)"
          >
            {{ letter }}
          </el-button>
        </div>

        <div v-if="mode === 'input'" class="input-mode">
          <el-input
            v-model="typedAnswer"
            placeholder="请输入完整单词"
            clearable
          />
        </div>

        <div class="answer">
          当前拼写：
          <strong>{{ mode === 'select' ? currentAnswer : typedAnswer }}</strong>
        </div>

        <div v-if="showHint" class="hint">
          正确答案：<strong>{{ currentWord.content }}</strong>
        </div>

        <div class="actions">
          <el-button type="success" @click="checkAnswer">提交</el-button>
          <el-button type="danger" @click="showHintTemporarily">提示</el-button>
          <el-button type="warning" @click="goWhere(-1)">上一个</el-button>
          <el-button type="warning" @click="goWhere(1)">下一个</el-button>
          <el-button type="primary" @click="updateIsTaboo(currentWord)">已熟悉</el-button>
          <el-button type="info" @click="openEditDialog(currentWord)">编辑</el-button>
        </div>
      </div>
      
      <el-empty v-else description="暂无单词，请刷新词库或添加内容" />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage } from 'element-plus';
import englishApi from '../../api/english';
import dayjs from 'dayjs';
import reviewApi from '../../api/reviewState';
import type {English} from '../../interface/english';
// 获取用户信息(存储在浏览器里了)
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const uid = currentUser.id;
const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id || null;
const mode = ref<'select' | 'input'>('select');
// 编辑弹窗(实际只有修改了)
const isEditMode = ref(false)
const dialogVisible = ref(false)
const openEditDialog = (row: any) => {
      isEditMode.value = true;
      form.value = { ...row };
      form.value.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
      dialogVisible.value = true;
};
const submitEnglish = async () => {
  try {
    if (isEditMode.value) {
        console.log(form.value);
      await englishApi.updateEnglish(form.value);
      ElMessage.success('修改成功');
    } else {
        // console.log(form.value);
      await englishApi.addEnglish(form.value);
      ElMessage.success('新增成功');
    }
    dialogVisible.value = false;
    fetchEnglishList();
  } catch (err) {
    console.error(err);
    ElMessage.error('操作失败');
  }
};
// 标熟
const updateIsTaboo = async (currentWord: English) => {
  if (!currentWord) return;
  try {
    currentWord.isTaboo = 1;
    currentWord.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    await englishApi.updateEnglish(currentWord);
    ElMessage.success('操作成功');
    // fetchEnglishList();
  } catch (err) {
    console.error(err);
    ElMessage.error('操作失败');
  }
}
// 获取要背的 english，初始化各个信息
const cww = 299521;
const englishList = ref<English[]>([]);
const filteredList = ref<English[]>([])
const filteredListLength = computed(() => filteredList.value.length)
const coreKeyFilter = ref('all');
const coreKeyOptions = computed(() => {
  const keys = Array.from(new Set(englishList.value.map(e => e.coreKey)));
  return ['all', ...keys];
});
const form = ref<English>({
    egId: 0,
    userId : uid,
    content: '',
    coreKey: '',
    translation: '',
    comment: '',
    createDate: '',
    updateDate: '',
    isDeleted: '',
    status: 'draft',
    isTaboo: 0,
    textCnt: 0,
});
const fetchEnglishList = async () => {
  try {
    vis.clear();
    currentIndex.value = 0;
    
    // 获取当前用户的英语内容
    const res = await englishApi.getEnglishByuserId(userId);
    const userEnglishList = res.data || [];
    
    // 处理熟悉状态的自动重置
    let v = dayjs().format('YYYY-MM-DD HH:mm:ss');
    for (let item of userEnglishList) {
      let diff = -dayjs(item.updateDate).diff(dayjs(v), 'seconds');
      if (diff >= cww && item.isTaboo == '1') {
        item.isTaboo = 0;
        try {
          item.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
          await englishApi.updateEnglish(item);
        } catch (err) {
          console.error(err);
        }
      }
    }
    
    // 过滤出未删除且未标记为熟悉的内容
    const list = userEnglishList.filter(
      (e: any) => e.isDeleted == '0' && e.isTaboo == 0
    );
    
    filteredList.value = list;
    englishList.value = list;
    startGame();
  } catch (err) {
    console.error(err);
    ElMessage.error('获取失败');
  }
};
// 实际不是随机获取的，是按顺序循环获取的
const currentIndex = ref(0)
const getRandomWord = () => {
  if (!filteredListLength.value) return null;
  let res = filteredList.value[currentIndex.value];
  console.log(currentIndex.value, filteredListLength.value - 1);
  while(vis.has(res)) {
    if(currentIndex.value == filteredListLength.value - 1) {
      currentIndex.value = 0;
      vis.clear();
      break;
    } else {
      currentIndex.value = (currentIndex.value + 1) % filteredListLength.value;
    }
    res = filteredList.value[currentIndex.value];
  }
  return res;
};
// 打乱字母
const shuffle = (word: string) => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
// 游戏开始
const currentWord = ref<English | null>(null);
const shuffledLetters = ref<string[]>([]);
const usedIndices = ref<number[]>([]);
const typedAnswer = ref('');
const showHint = ref(false); // 显示提示
const startGame = () => {
  const word = getRandomWord();
  if (!word) {
    currentWord.value = null;
    return;
  }
  currentWord.value = word;
  shuffledLetters.value = shuffle(word.content);
  usedIndices.value = [];
  typedAnswer.value = '';
  showHint.value = false;
};
// 选择字母
const selectLetter = (index: number) => {
  const i = usedIndices.value.indexOf(index);
  if (i === -1) {
    usedIndices.value.push(index);
  } else {
    usedIndices.value.splice(i, 1);
  }
};
// 检查答案
const currentAnswer = computed(() =>
  usedIndices.value.map(i => shuffledLetters.value[i]).join('')
);
const vis = new Set();
const streak = ref(0); // 连续答对次数
const checkAnswer = () => {
  if (!currentWord.value) return;

  const answer =
    mode.value === 'select'
      ? currentAnswer.value
      : typedAnswer.value.trim();
    // console.log(currentAnswer.value.length, answer.length, currentWord.value.content.length, 11111)
  if (answer.length < currentWord.value.content.length) {
    // console.log(answer.length, currentWord.value.content.length, 222)
    ElMessage.warning('请先完成全部拼写');
    return;
  }

  if (answer.toLowerCase() === currentWord.value.content.toLowerCase()) {
    ElMessage.success('🎉 答对了！');
    streak.value++;
    vis.add(currentWord.value);
    currentWord.value.textCnt += 1;
    try {
        currentWord.value.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
        englishApi.updateEnglish(currentWord.value);
      } catch (err) {
        console.error(err);
        ElMessage.error('操作失败');
      }
    currentIndex.value = (currentIndex.value + 1) % filteredListLength.value;
    setTimeout(startGame, 600);
  } else {
    ElMessage.warning('❌ 拼错了，已重置连击');
    streak.value = 0;
  }

  typedAnswer.value = '';
};
// 显示提示
let hintTimeout: number | null = null;
const showHintTemporarily = () => {
  if (!currentWord.value) return;
  showHint.value = true;
  if (hintTimeout) clearTimeout(hintTimeout);
  hintTimeout = window.setTimeout(() => {
    showHint.value = false;
  }, 2000);
};
// 上/下一个
const goWhere = (v : number) => {
  console.log(currentIndex.value, 9999);
  currentIndex.value = (currentIndex.value + v + filteredListLength.value) % filteredListLength.value;
  console.log(currentIndex.value, 9999999);
  startGame();
};
// 按 Enter 进行检查
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    checkAnswer();
  }
};
// 源头，没了
onMounted(() => {
  console.log(reviewApi.getAllReviews(userId));
  fetchEnglishList();
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (hintTimeout) clearTimeout(hintTimeout);
});

// 🔁 筛选关键词时重新开始游戏
watch(coreKeyFilter, () => {
  filteredList.value = englishList.value.filter(e => e.coreKey === coreKeyFilter.value)
  vis.clear();
  currentIndex.value = 0;
  streak.value = 0;
  startGame();
});
</script>

<style scoped>
.spelling-game-page {
  padding: 30px;
  background-color: #f9fafc;
  min-height: 100vh;
}

.game-card {
  max-width: 600px;
  margin: auto;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background-color: #fff;
  transition: all 0.3s ease-in-out;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.letters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 15px 0;
}

.el-button {
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-2px);
}

.el-button.is-plain {
  border: 2px dashed #f56c6c !important;
  background-color: #fff !important;
  color: #f56c6c !important;
  font-weight: bold;
}

.input-mode {
  max-width: 300px;
  margin: 20px auto;
}

.answer {
  font-size: 18px;
  margin: 15px 0;
  padding: 10px 0;
  background-color: #f0f9eb;
  border-radius: 8px;
  font-weight: bold;
  color: #67c23a;
  border: 1px solid #d2f1c7;
}

.hint {
  margin: 10px 0;
  font-size: 16px;
  color: #909399;
  animation: fade-in 0.3s ease-in-out;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

/* 正确答案动画 */
.success-flash {
  animation: flash-success 0.5s ease-in-out;
}

/* 错误抖动动画 */
.error-shake {
  animation: shake 0.4s ease-in-out;
}

/* 动画定义 */
@keyframes flash-success {
  0% {
    background-color: #e1f3d8;
  }
  100% {
    background-color: transparent;
  }
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

</style>
