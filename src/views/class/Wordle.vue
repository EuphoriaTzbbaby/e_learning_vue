<template>
  <div class="wordle-game">
    <el-card class="game-card" :body-style="{ padding: '20px' }">
      <!-- 游戏头部 -->
      <div class="game-header">
        <h2>单词猜猜乐</h2>
        <div class="game-stats">
          <el-tag type="info" effect="dark">
            胜率: {{ winRate }}%
          </el-tag>
          <el-tag type="success" effect="dark">
            连胜: {{ streak }}
          </el-tag>
          <el-tag type="warning" effect="dark">
            当前难度: {{ difficultyLevel }}
          </el-tag>
        </div>
      </div>
      <!-- 游戏控制区 -->
      <div class="game-controls">
        <el-button-group>
          <el-button type="primary" @click="startNewGame" :icon="RefreshRight">
            新游戏
          </el-button>
          <el-button type="success" @click="showHint" :disabled="hintsRemaining === 0">
            提示 ({{ hintsRemaining }})
          </el-button>
          <el-button type="warning" @click="toggleTheme">
            {{ isDarkMode ? '亮色模式' : '暗色模式' }}
          </el-button>
        </el-button-group>
        <el-select v-model="difficulty" placeholder="选择难度" @change="changeDifficulty">
          <el-option label="简单 (4字母)" value="easy" />
          <el-option label="中等 (5字母)" value="medium" />
          <el-option label="困难 (6字母)" value="hard" />
        </el-select>
      </div>
      <!-- 游戏网格 -->
      <div class="game-grid" :class="{ 'dark-mode': isDarkMode }">
        <div v-for="(row, rowIndex) in gameGrid" :key="rowIndex" class="grid-row">
          <div
            v-for="(cell, cellIndex) in row"
            :key="cellIndex"
            class="grid-cell"
            :class="{
              'filled': cell.letter,
              'correct': cell.status === 'correct',
              'present': cell.status === 'present',
              'absent': cell.status === 'absent',
              'current': rowIndex === currentRow && cellIndex === currentCol,
              'shake': shakeRow === rowIndex
            }"
          >
            {{ cell.letter }}
          </div>
        </div>
      </div>
      <!-- 虚拟键盘 -->
      <div class="keyboard" :class="{ 'dark-mode': isDarkMode }">
        <div v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex" class="keyboard-row">
          <button
            v-for="key in row"
            :key="key"
            class="key"
            :class="{
              'correct': keyStatus[key] === 'correct',
              'present': keyStatus[key] === 'present',
              'absent': keyStatus[key] === 'absent',
              'wide': key === 'ENTER' || key === 'BACK'
            }"
            @click="handleKeyClick(key)"
          >
            {{ key === 'BACK' ? '⌫' : key }}
          </button>
        </div>
      </div>
      <!-- 游戏状态提示 -->
      <div v-if="gameStatus !== 'playing'" class="game-message">
        <el-alert
          :title="gameStatus === 'won' ? '恭喜你猜对了！' : '很遗憾，再试一次吧！'"
          :type="gameStatus === 'won' ? 'success' : 'error'"
          :description="`答案是: ${targetWord}`"
          show-icon
          center
          :closable="false"
        />
      </div>
      <!-- 游戏统计弹窗 -->
      <el-dialog v-model="showStats" title="游戏统计" width="500px">
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-value">{{ gamesPlayed }}</div>
            <div class="stat-label">游戏次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ winRate }}%</div>
            <div class="stat-label">胜率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ currentStreak }}</div>
            <div class="stat-label">当前连胜</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ maxStreak }}</div>
            <div class="stat-label">最高连胜</div>
          </div>
        </div>
        <div class="guess-distribution">
          <h4>猜测分布</h4>
          <div v-for="(count, index) in guessDistribution" :key="index" class="guess-bar">
            <div class="guess-label">{{ index + 1 }}</div>
            <div class="guess-bar-container">
              <div 
                class="guess-bar-fill" 
                :style="{ width: `${(count / Math.max(...guessDistribution)) * 100}%` }"
              ></div>
            </div>
            <div class="guess-count">{{ count }}</div>
          </div>
        </div>
      </el-dialog>
      <!-- 设置按钮 -->
      <div class="settings-btn">
        <el-button circle @click="showStats = true" :icon="DataLine" />
        <el-button circle @click="showSettings = true" :icon="Setting" />
      </div>
    </el-card>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted} from 'vue';
import { ElMessage} from 'element-plus';
import { RefreshRight, DataLine, Setting } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import englishApi from '../../api/english';
import reviewApi from '../../api/reviewState';
import type { English } from '../../interface/english';
// 获取用户信息
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null;
const userId = currentUser.id;
export default defineComponent({
  name: 'WordleGame',
  components: {
    RefreshRight,
    DataLine,
    Setting
  },
  setup() {
    // 游戏状态
    const gameStatus = ref<'playing' | 'won' | 'lost'>('playing');
    const targetWord = ref('');
    const currentRow = ref(0);
    const currentCol = ref(0);
    const gameGrid = ref<Array<Array<{ letter: string; status: string }>>>([]);
    const shakeRow = ref(-1);
    const isDarkMode = ref(false);
    const difficulty = ref('medium');
    const hintsRemaining = ref(2);
    const showStats = ref(false);
    const showSettings = ref(false);
    // 键盘布局
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
    ];
    // 键盘状态
    const keyStatus = ref<Record<string, string>>({});
    // 游戏统计
    const gamesPlayed = ref(0);
    const gamesWon = ref(0);
    const currentStreak = ref(0);
    const maxStreak = ref(0);
    const guessDistribution = ref([0, 0, 0, 0, 0, 0]);
    // 单词列表
    const englishList = ref<English[]>([]);
    const filteredWords = ref<string[]>([]);
    // 计算属性
    const winRate = computed(() => {
      return gamesPlayed.value ? Math.round((gamesWon.value / gamesPlayed.value) * 100) : 0;
    });
    const streak = computed(() => currentStreak.value);
    const difficultyLevel = computed(() => {
      switch (difficulty.value) {
        case 'easy': return '简单';
        case 'medium': return '中等';
        case 'hard': return '困难';
        default: return '中等';
      }
    });
    // 获取单词列表
    const fetchEnglishList = async () => {
      try {
        const res = await englishApi.getAllEnglish();
        englishList.value = res.data.filter((item: any) => 
          item.userId == userId && item.isDeleted == 0
        );
        // 根据难度过滤单词
        updateFilteredWords();
      } catch (err) {
        console.error(err);
        ElMessage.error('获取单词列表失败');
      }
    };
    // 根据难度更新单词列表
    const updateFilteredWords = () => {
      const wordLength = difficulty.value === 'easy' ? 4 : 
                        difficulty.value === 'medium' ? 5 : 6;
      filteredWords.value = englishList.value
        .map(item => item.content.trim().toUpperCase())
        .filter(word => word.length === wordLength && /^[A-Z]+$/.test(word));
    };
    // 初始化游戏网格
    const initGameGrid = () => {
      const rows = 6;
      const cols = difficulty.value === 'easy' ? 4 : 
                  difficulty.value === 'medium' ? 5 : 6;
      gameGrid.value = Array(rows).fill(null).map(() => 
        Array(cols).fill(null).map(() => ({
          letter: '',
          status: ''
        }))
      );
    };
    // 开始新游戏
    const startNewGame = () => {
      if (filteredWords.value.length === 0) {
        ElMessage.warning('没有符合条件的单词，请检查单词列表');
        return;
      }
      // 随机选择目标单词
      const randomIndex = Math.floor(Math.random() * filteredWords.value.length);
      targetWord.value = filteredWords.value[randomIndex];
      // 重置游戏状态
      gameStatus.value = 'playing';
      currentRow.value = 0;
      currentCol.value = 0;
      shakeRow.value = -1;
      hintsRemaining.value = 2;
      keyStatus.value = {};
      // 初始化网格
      initGameGrid();
      console.log('目标单词:', targetWord.value); // 调试用，实际应删除
    };
    // 处理键盘点击
    const handleKeyClick = (key: string) => {
      if (gameStatus.value !== 'playing') return;
      const cols = difficulty.value === 'easy' ? 4 : 
                  difficulty.value === 'medium' ? 5 : 6;
      if (key === 'BACK') {
        // 删除字母
        if (currentCol.value > 0) {
          currentCol.value--;
          gameGrid.value[currentRow.value][currentCol.value].letter = '';
        }
      } else if (key === 'ENTER') {
        // 提交猜测
        submitGuess();
      } else {
        // 添加字母
        if (currentCol.value < cols) {
          gameGrid.value[currentRow.value][currentCol.value].letter = key;
          currentCol.value++;
        }
      }
    };
    // 提交猜测
    const submitGuess = async () => {
      const cols = difficulty.value === 'easy' ? 4 : 
                  difficulty.value === 'medium' ? 5 : 6;
      // 检查是否填满当前行
      if (currentCol.value !== cols) {
        shakeRow.value = currentRow.value;
        setTimeout(() => { shakeRow.value = -1; }, 500);
        ElMessage.warning('请填满所有格子');
        return;
      }
      // 获取当前猜测的单词
      const guess = gameGrid.value[currentRow.value]
        .map(cell => cell.letter)
        .join('');
      // 检查单词是否在列表中
      if (!filteredWords.value.includes(guess)) {
        shakeRow.value = currentRow.value;
        setTimeout(() => { shakeRow.value = -1; }, 500);
        ElMessage.error('不是有效单词');
        return;
      }
      // 检查字母状态
      const targetLetters = targetWord.value.split('');
      const guessLetters = guess.split('');
      const letterStatus: Record<string, string> = {};
      // 第一遍：标记正确位置的字母
      for (let i = 0; i < cols; i++) {
        if (guessLetters[i] === targetLetters[i]) {
          gameGrid.value[currentRow.value][i].status = 'correct';
          letterStatus[guessLetters[i]] = 'correct';
          targetLetters[i] = ''; // 标记为已处理
        }
      }
      // 第二遍：标记存在但位置错误的字母
      for (let i = 0; i < cols; i++) {
        if (gameGrid.value[currentRow.value][i].status !== 'correct') {
          const index = targetLetters.indexOf(guessLetters[i]);
          if (index !== -1) {
            gameGrid.value[currentRow.value][i].status = 'present';
            letterStatus[guessLetters[i]] = 'present';
            targetLetters[index] = ''; // 标记为已处理
          } else {
            gameGrid.value[currentRow.value][i].status = 'absent';
            if (!letterStatus[guessLetters[i]]) {
              letterStatus[guessLetters[i]] = 'absent';
            }
          }
        }
      }
      // 更新键盘状态
      Object.keys(letterStatus).forEach(key => {
        if (!keyStatus.value[key] || 
            (keyStatus.value[key] !== 'correct' && letterStatus[key] === 'correct') ||
            (keyStatus.value[key] === 'absent' && letterStatus[key] !== 'absent')) {
          keyStatus.value[key] = letterStatus[key];
        }
      });
      // 检查游戏状态
      if (guess === targetWord.value) {
        gameStatus.value = 'won';
        gamesWon.value++;
        currentStreak.value++;
        if (currentStreak.value > maxStreak.value) {
          maxStreak.value = currentStreak.value;
        }
        guessDistribution.value[currentRow.value]++;
        ElMessage.success('恭喜你猜对了！');
        // 更新复习状态
        updateReviewState(true);
      } else if (currentRow.value === 5) {
        gameStatus.value = 'lost';
        currentStreak.value = 0;
        ElMessage.error(`游戏结束！答案是: ${targetWord.value}`);
        // 更新复习状态
        updateReviewState(false);
      } else {
        // 进入下一行
        currentRow.value++;
        currentCol.value = 0;
      }
      // 更新游戏统计
      gamesPlayed.value++;
      saveGameStats();
    };
    // 显示提示
    const showHint = () => {
      if (hintsRemaining.value <= 0) return;
      hintsRemaining.value--;
      // 找到一个未揭示的位置
      const cols = difficulty.value === 'easy' ? 4 : 
                  difficulty.value === 'medium' ? 5 : 6;
      const unrevealedPositions = [];
      for (let i = 0; i < cols; i++) {
        if (!gameGrid.value[currentRow.value][i].letter) {
          unrevealedPositions.push(i);
        }
      }
      if (unrevealedPositions.length > 0) {
        const randomPos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
        gameGrid.value[currentRow.value][randomPos].letter = targetWord.value[randomPos];
        currentCol.value = randomPos + 1;
        ElMessage.info(`提示: 第${randomPos + 1}个字母是 ${targetWord.value[randomPos]}`);
      }
    };
    // 切换主题
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      document.documentElement.classList.toggle('dark', isDarkMode.value);
    };
    // 更改难度
    const changeDifficulty = () => {
      updateFilteredWords();
      startNewGame();
    };
    // 更新复习状态
    const updateReviewState = async (isCorrect: boolean) => {
      try {
        // 查找当前单词对应的复习记录
        const englishItem = englishList.value.find(
          item => item.content.trim().toUpperCase() === targetWord.value
        );
        if (!englishItem) return;
        // 获取复习状态
        const reviewRes = await reviewApi.getReviewById(englishItem.egId);
        let reviewState = reviewRes.data;
        if (reviewState) {
          // 更新现有复习状态
          reviewState.repetitions = (reviewState.repetitions || 0) + 1;
          reviewState.lastReview = dayjs().format('YYYY-MM-DD HH:mm:ss');
          reviewState.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
          // 根据答案正确性更新参数
          if (isCorrect) {
            reviewState.strength = Math.min(1.0, reviewState.strength + 0.2);
            reviewState.interval_days = Math.min(30, reviewState.interval_days * 2);
          } else {
            reviewState.strength = Math.max(0.1, reviewState.strength - 0.1);
            reviewState.interval_days = Math.max(1, Math.floor(reviewState.interval_days / 2));
          }
          // 计算下次复习时间
          const nextReviewDate = dayjs().add(reviewState.interval_days, 'day');
          reviewState.nextReview = nextReviewDate.format('YYYY-MM-DD HH:mm:ss');
          await reviewApi.updateReview(reviewState);
        } else {
          // 创建新的复习状态
          const newReviewState = {
            userId: userId,
            egId: englishItem.egId,
            interval_days: isCorrect ? 1 : 0,
            strength: isCorrect ? 0.5 : 0.2,
            difficulty: 0.5,
            forgetting_idx: 0,
            repetitions: 1,
            lastReview: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            nextReview: dayjs().add(isCorrect ? 1 : 0, 'day').format('YYYY-MM-DD HH:mm:ss'),
            createDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          };
          await reviewApi.addReview(newReviewState);
        }
      } catch (err) {
        console.error('更新复习状态失败:', err);
      }
    };
    // 保存游戏统计
    const saveGameStats = () => {
      const stats = {
        gamesPlayed: gamesPlayed.value,
        gamesWon: gamesWon.value,
        currentStreak: currentStreak.value,
        maxStreak: maxStreak.value,
        guessDistribution: guessDistribution.value
      };
      localStorage.setItem('wordleStats', JSON.stringify(stats));
    };
    // 加载游戏统计
    const loadGameStats = () => {
      const savedStats = localStorage.getItem('wordleStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        gamesPlayed.value = stats.gamesPlayed || 0;
        gamesWon.value = stats.gamesWon || 0;
        currentStreak.value = stats.currentStreak || 0;
        maxStreak.value = stats.maxStreak || 0;
        guessDistribution.value = stats.guessDistribution || [0, 0, 0, 0, 0, 0];
      }
    };
    // 处理物理键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameStatus.value !== 'playing') return;
      const key = event.key.toUpperCase();
      if (key >= 'A' && key <= 'Z') {
        handleKeyClick(key);
      } else if (key === 'BACKSPACE') {
        handleKeyClick('BACK');
      } else if (key === 'ENTER') {
        handleKeyClick('ENTER');
      }
    };
    // 生命周期钩子
    onMounted(async () => {
      await fetchEnglishList();
      loadGameStats();
      startNewGame();
      // 添加键盘事件监听
      window.addEventListener('keydown', handleKeyDown);
    });
    // 清理事件监听
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
    return {
      gameStatus,
      gameGrid,
      currentRow,
      currentCol,
      shakeRow,
      isDarkMode,
      difficulty,
      hintsRemaining,
      targetWord,
      showStats,
      showSettings,
      keyboardLayout,
      keyStatus,
      winRate,
      streak,
      difficultyLevel,
      gamesPlayed,
      gamesWon,
      currentStreak,
      maxStreak,
      guessDistribution,
      handleKeyClick,
      startNewGame,
      showHint,
      toggleTheme,
      changeDifficulty,
      RefreshRight,
      DataLine,
      Setting
    };
  }
});
</script>
<style scoped>
.wordle-game {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.game-card {
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.game-header h2 {
  margin: 0;
  color: #409eff;
}
.game-stats {
  display: flex;
  gap: 10px;
}
.game-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.game-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 20px 0;
  justify-content: center;
}
.grid-row {
  display: flex;
  gap: 5px;
  justify-content: center;
}
.grid-cell {
  width: 50px;
  height: 50px;
  border: 2px solid #d3d3d3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  text-transform: uppercase;
  transition: all 0.3s ease;
  border-radius: 4px;
}
.grid-cell.filled {
  animation: pop 0.2s ease-in-out;
}
.grid-cell.correct {
  background-color: #6aaa64;
  border-color: #6aaa64;
  color: white;
}
.grid-cell.present {
  background-color: #c9b458;
  border-color: #c9b458;
  color: white;
}
.grid-cell.absent {
  background-color: #787c7e;
  border-color: #787c7e;
  color: white;
}
.grid-cell.current {
  border-color: #409eff;
  animation: pulse 1s infinite;
}
.grid-cell.shake {
  animation: shake 0.5s;
}
@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
@keyframes pulse {
  0% { border-color: #409eff; }
  50% { border-color: #a0cfff; }
  100% { border-color: #409eff; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.keyboard {
  margin-top: 20px;
}
.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}
.key {
  min-width: 40px;
  height: 45px;
  border: none;
  border-radius: 4px;
  background-color: #d3d6da;
  color: #000;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.key:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.key:active {
  transform: translateY(0);
}
.key.wide {
  min-width: 65px;
}
.key.correct {
  background-color: #6aaa64;
  color: white;
}
.key.present {
  background-color: #c9b458;
  color: white;
}
.key.absent {
  background-color: #787c7e;
  color: white;
}
.game-message {
  margin-top: 20px;
}
.settings-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.stats-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}
.stat-label {
  font-size: 14px;
  color: #666;
}
.guess-distribution {
  margin-top: 20px;
}
.guess-bar {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.guess-label {
  width: 20px;
  text-align: right;
  margin-right: 5px;
  font-size: 14px;
}
.guess-bar-container {
  flex-grow: 1;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.guess-bar-fill {
  height: 100%;
  background-color: #409eff;
  transition: width 0.5s ease;
}
.guess-count {
  width: 20px;
  text-align: left;
  margin-left: 5px;
  font-size: 14px;
}
/* 暗色模式 */
.dark-mode {
  background-color: #121213;
  color: #ffffff;
}
.dark-mode .grid-cell {
  border-color: #3a3a3c;
}
.dark-mode .key {
  background-color: #818384;
  color: #ffffff;
}
.dark-mode .key.correct {
  background-color: #538d4e;
}
.dark-mode .key.present {
  background-color: #b59f3b;
}
.dark-mode .key.absent {
  background-color: #3a3a3c;
}
.dark-mode .stat-label {
  color: #d3d3d3;
}
.dark-mode .guess-bar-container {
  background-color: #3a3a3c;
}
.dark-mode .guess-bar-fill {
  background-color: #538d4e;
}
</style>