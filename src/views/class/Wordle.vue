<template>
  <div class="wordle-game">
    <el-card class="game-card" :body-style="{ padding: '20px' }">
      <!-- 游戏头部 -->
      <div class="game-header">
        <h2>考研英语单词猜猜乐</h2>
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
          <el-option label="3字母" value="3" />
          <el-option label="4字母" value="4" />
          <el-option label="5字母" value="5" />
          <el-option label="6字母" value="6" />
          <el-option label="7字母" value="7" />
          <el-option label="8字母" value="8" />
          <el-option label="9字母" value="9" />
          <el-option label="10字母" value="10" />
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
              'incorrect': cell.status === 'incorrect',
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
              'wide': key === 'enter' || key === 'back'
            }"
            @click="handleKeyClick(key)"
          >
            {{ key === 'back' ? '⌫' : (key === 'enter' ? 'enter' : key) }}
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
      
      <!-- 单词释义 -->
      <div v-if="gameStatus !== 'playing'" class="word-meaning">
        <el-card>
          <template #header>
            <div class="meaning-header">
              <span>{{ targetWord }}</span>
              <el-tag type="info">{{ difficultyLevel }}</el-tag>
            </div>
          </template>
          <p>{{ currentWordMeaning }}</p>
        </el-card>
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
                :style="{ width: `${(count / Math.max(...guessDistribution, 1)) * 100}%` }"
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
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { RefreshRight, DataLine, Setting } from '@element-plus/icons-vue';
import { loadGraduateWords, filterWordsByDifficulty } from '../../utils/wordLoader.ts';

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
    const targetWord = ref(''); // 存储小写
    const currentWordMeaning = ref('');
    const currentRow = ref(0);
    const currentCol = ref(0);
    const gameGrid = ref<Array<Array<{ letter: string; status: string }>>>([]);
    const shakeRow = ref(-1);
    const isDarkMode = ref(false);
    const difficulty = ref('5'); // 默认5字母
    const hintsRemaining = ref(2);
    const showStats = ref(false);
    const showSettings = ref(false);
    
    // 键盘布局 - 全部小写
    const keyboardLayout = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back']
    ];
    
    // 键盘状态 - 使用小写字母作为键
    const keyStatus = ref<Record<string, string>>({});
    
    // 游戏统计
    const gamesPlayed = ref(0);
    const gamesWon = ref(0);
    const currentStreak = ref(0);
    const maxStreak = ref(0);
    const guessDistribution = ref([0, 0, 0, 0, 0, 0]);
    
    // 单词列表
    const allWords = ref<Array<{word: string, meaning: string}>>([]);
    const filteredWords = ref<string[]>([]); // 存储小写
    
    // 计算属性
    const winRate = computed(() => {
      return gamesPlayed.value ? Math.round((gamesWon.value / gamesPlayed.value) * 100) : 0;
    });
    const streak = computed(() => currentStreak.value);
    const difficultyLevel = computed(() => {
      return `${difficulty.value}字母`;
    });
    
    // 获取当前列数
    const getCurrentCols = () => {
      return parseInt(difficulty.value);
    };
    
    // 获取单词列表
    const fetchEnglishList = async () => {
      try {
        // 从本地txt文件加载单词
        allWords.value = await loadGraduateWords();
        if (allWords.value.length === 0) {
          ElMessage.error('未能加载单词列表，请检查文件是否存在');
          return;
        }
        // 根据难度过滤单词
        updateFilteredWords();
        ElMessage.success(`成功加载 ${allWords.value.length} 个考研单词`);
      } catch (err) {
        console.error(err);
        ElMessage.error('获取单词列表失败');
      }
    };
    
    // 根据难度更新单词列表
    const updateFilteredWords = () => {
      const wordLength = getCurrentCols();
      filteredWords.value = filterWordsByDifficulty(allWords.value, wordLength.toString());
      console.log(`当前难度 ${difficulty.value} 字母下有 ${filteredWords.value.length} 个单词`);
    };
    
    // 初始化游戏网格
    const initGameGrid = () => {
      const rows = 6;
      const cols = getCurrentCols();
      gameGrid.value = Array(rows).fill(null).map(() => 
        Array(cols).fill(null).map(() => ({
          letter: '', // 存储小写
          status: ''
        }))
      );
    };
    
    // 开始新游戏
    const startNewGame = () => {
      if (filteredWords.value.length === 0) {
        ElMessage.warning(`没有符合条件的${difficulty.value}字母单词，请选择其他难度`);
        return;
      }
      
      // 随机选择目标单词
      const randomIndex = Math.floor(Math.random() * filteredWords.value.length);
      targetWord.value = filteredWords.value[randomIndex]; // 存储小写
      
      // 获取单词释义
      const wordObj = allWords.value.find(item => item.word === targetWord.value);
      currentWordMeaning.value = wordObj ? wordObj.meaning : '暂无释义';
      
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
      const cols = getCurrentCols();
      
      if (key === 'back') {
        // 删除字母
        if (currentCol.value > 0) {
          currentCol.value--;
          gameGrid.value[currentRow.value][currentCol.value].letter = '';
        }
      } else if (key === 'enter') {
        // 提交猜测
        submitGuess();
      } else {
        // 添加字母（小写）
        if (currentCol.value < cols) {
          gameGrid.value[currentRow.value][currentCol.value].letter = key;
          currentCol.value++;
        }
      }
    };
    
    // 提交猜测
    const submitGuess = async () => {
      const cols = getCurrentCols();
      
      // 检查是否填满当前行
      if (currentCol.value !== cols) {
        shakeRow.value = currentRow.value;
        setTimeout(() => { shakeRow.value = -1; }, 500);
        ElMessage.warning('请填满所有格子');
        return;
      }
      
      // 获取当前猜测的单词（小写）
      const guess = gameGrid.value[currentRow.value]
        .map(cell => cell.letter)
        .join('');
      
      // 检查单词是否在列表中
      if (!filteredWords.value.includes(guess)) {
        for(let i = 0; i < cols; i++) {
          gameGrid.value[currentRow.value][i].status = 'incorrect';
        }
        shakeRow.value = currentRow.value;
        setTimeout(() => { shakeRow.value = -1; }, 500);
        ElMessage.error('不是有效单词');
        currentRow.value++;
        currentCol.value = 0;
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
          letterStatus[guessLetters[i]] = 'correct'; // 键盘状态使用小写
          targetLetters[i] = ''; // 标记为已处理
        }
      }
      
      // 第二遍：标记存在但位置错误的字母
      for (let i = 0; i < cols; i++) {
        if (gameGrid.value[currentRow.value][i].status !== 'correct') {
          const index = targetLetters.indexOf(guessLetters[i]);
          if (index !== -1) {
            gameGrid.value[currentRow.value][i].status = 'present';
            letterStatus[guessLetters[i]] = 'present'; // 键盘状态使用小写
            targetLetters[index] = ''; // 标记为已处理
          } else {
            gameGrid.value[currentRow.value][i].status = 'absent';
            if (!letterStatus[guessLetters[i]]) {
              letterStatus[guessLetters[i]] = 'absent'; // 键盘状态使用小写
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
      } else if (currentRow.value === 5) {
        gameStatus.value = 'lost';
        currentStreak.value = 0;
        ElMessage.error(`游戏结束！答案是: ${targetWord.value}`);
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
      // 找到一个未揭示的位置
      const cols = getCurrentCols();
      const unrevealedPositions = [];
      let filledPositions = 0; // 已填写的位置计数
      // 检查每一列是否在之前行中已经是correct状态
      for (let i = 0; i < cols; i++) {
        // 如果当前位置已经有字母，增加已填写计数
        if (gameGrid.value[currentRow.value][i].letter) {
          filledPositions++;
          continue;
        }
        // 检查该列在之前行中是否已经是correct状态
        let isColumnCorrect = false;
        for (let row = 0; row < currentRow.value; row++) {
          if (gameGrid.value[row][i].status === 'correct') {
            isColumnCorrect = true;
            filledPositions++; // 正确的列也算作已填写
            break;
          }
        }
        // 如果该列在之前行中不是correct状态，则加入可提示位置列表
        if (!isColumnCorrect) {
          unrevealedPositions.push(i);
        }
      }
      // 计算未填写的位置数
      const unfilledCount = cols - filledPositions;
      // 如果只剩下一列未猜出来，不给提示
      if (unfilledCount === 1) {
        ElMessage.warning('只剩一个字母了，自己猜猜看吧！');
        return;
      }
      // 如果没有可提示的位置，显示提示信息
      if (unrevealedPositions.length === 0) {
        ElMessage.warning('没有可提示的字母，所有未知列都已提示或已猜对');
        return;
      }
      // 有可提示的位置，执行提示逻辑
      hintsRemaining.value--;
      const randomPos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
      gameGrid.value[currentRow.value][randomPos].letter = targetWord.value[randomPos]; // 存储小写
      currentCol.value = randomPos + 1;
      ElMessage.info(`提示: 第${randomPos + 1}个字母是 ${targetWord.value[randomPos]}`);
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
      
      // 处理删除键
      if (event.key === 'Backspace') {
        handleKeyClick('back');
        return;
      }
      
      // 处理回车键
      if (event.key === 'Enter') {
        handleKeyClick('enter');
        return;
      }
      
      // 处理字母键（转换为小写）
      const key = event.key.toLowerCase();
      if (key >= 'a' && key <= 'z') {
        handleKeyClick(key);
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
      currentWordMeaning,
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
.grid-cell.incorrect {
  background-color: #441bbd;
  border-color: #12d830;
  color: rgb(204, 12, 12);
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
.word-meaning {
  margin-top: 20px;
}
.meaning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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