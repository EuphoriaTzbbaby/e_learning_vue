<template>
  <div class="wordle-game">
    <el-card class="game-card" :body-style="{ padding: '20px' }">
      <!-- 游戏头部 -->
      <div class="game-header">
        <h2>考研英语单词猜猜乐</h2>
        <div class="game-stats">
          <el-tag type="info" effect="dark">胜率: {{ winRate }}%</el-tag>
          <el-tag type="success" effect="dark">连胜: {{ streak }}</el-tag>
          <el-tag type="warning" effect="dark">当前难度: {{ difficultyLevel }}</el-tag>
        </div>

        <div class="header-actions">
          <el-button type="primary" link :icon="DataLine" @click="showStats = true">游戏统计</el-button>
          <el-button type="success" link :icon="Setting" @click="openLeaderboard">排行榜</el-button>
        </div>
      </div>

      <!-- 游戏控制区 -->
      <div class="game-controls">
        <div class="vocabulary-source">
          <el-radio-group v-model="vocabularySource" @change="changeVocabularySource">
            <el-radio-button label="graduate">考研词汇</el-radio-button>
            <el-radio-button label="today">今日学习词汇</el-radio-button>
          </el-radio-group>
        </div>

        <el-button-group>
          <el-button type="primary" @click="startNewGame" :icon="RefreshRight">新游戏</el-button>
          <el-button type="success" @click="showHint" :disabled="hintsRemaining === 0">提示 ({{ hintsRemaining }})</el-button>
          <el-button type="warning" @click="toggleTheme">{{ isDarkMode ? '亮色模式' : '暗色模式' }}</el-button>
        </el-button-group>

        <el-select v-model="difficulty" placeholder="选择难度" @change="changeDifficulty" @keydown.enter.stop.prevent>
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
              filled: !!cell.letter,
              correct: cell.status === 'correct',
              present: cell.status === 'present',
              absent: cell.status === 'absent',
              incorrect: cell.status === 'incorrect',
              current: rowIndex === currentRow && cellIndex === currentActiveIndex,
              shake: shakeRow === rowIndex
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
              correct: keyStatus[key] === 'correct',
              present: keyStatus[key] === 'present',
              absent: keyStatus[key] === 'absent',
              wide: key === 'enter' || key === 'back'
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
        <div class="stats-grid">
          <el-card shadow="hover" class="stat-card">
            <template #header>游戏次数</template>
            <div class="stat-big">{{ gamesPlayed }}</div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <template #header>胜率</template>
            <div class="stat-big">{{ winRate }}%</div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <template #header>当前连胜</template>
            <div class="stat-big">{{ currentStreak }}</div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <template #header>最高连胜</template>
            <div class="stat-big">{{ maxStreak }}</div>
          </el-card>
        </div>
      </el-dialog>

      <!-- 排行榜弹窗 -->
      <el-dialog v-model="showSettings" title="排行榜" width="650px">
        <el-table
          :data="leaderboardRows"
          border
          stripe
          style="width: 100%"
          max-height="520"
          v-loading="leaderboardLoading"
        >
          <el-table-column
            type="index"
            label="排名"
            width="80"
            align="center"
            :index="indexMethodLeaderboard"
          />
          <el-table-column prop="userId" label="玩家" width="180" align="center" />
          <el-table-column prop="winRateStr" label="胜率" width="140" align="center" />
          <el-table-column prop="wins" label="胜利总场数" width="180" align="center" />
          <el-table-column prop="played" label="总场数" width="130" align="center" />
        </el-table>

        <template #footer>
          <el-button @click="showSettings = false">关闭</el-button>
        </template>
      </el-dialog>

    </el-card>
  </div>
</template>

<script lang="ts">
import dayjs from 'dayjs';
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { RefreshRight, DataLine, Setting } from '@element-plus/icons-vue';
import { loadGraduateWords, filterWordsByDifficulty } from '../../utils/wordLoader.ts';
import gameRecordApi from '../../api/gameRecord';
import userActionLogApi from '../../api/userActionLog';
import englishApi from '../../api/english';
import reviewLogApi  from '../../api/reviewLog.ts';
import type { GameRecord } from '../../interface/gameRecord';

export default defineComponent({
  name: 'WordleGame',
  components: { RefreshRight, DataLine, Setting },
  setup() {
    // --- 基本状态 ---
    const gameStatus = ref<'playing' | 'won' | 'lost'>('playing');
    const targetWord = ref(''); // 小写
    const currentWordMeaning = ref('');
    const currentRow = ref(0);
    const currentCol = ref(0); // 指向下一个可填格子 (0..cols)
    const gameGrid = ref<Array<Array<{ letter: string; status: string }>>>([]);
    const shakeRow = ref(-1);
    const isDarkMode = ref(false);
    const difficulty = ref('5');
    const hintsRemaining = ref(2);
    const showStats = ref(false);
    const showSettings = ref(false);
    const leaderboardLoading = ref(false);
    const rows = 7;

    // 词汇来源：graduate-考研词汇，today-今日学习词汇
    const vocabularySource = ref<'graduate' | 'today'>('graduate');

    // IME 处理
    const isComposing = ref(false);

    // 键盘布局（小写）
    const keyboardLayout = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back']
    ];

    // 键盘状态（只记录字母）
    const keyStatus = ref<Record<string, 'correct' | 'present' | 'absent' | undefined>>({});

    // 统计
    const gamesPlayed = ref(0);
    const gamesWon = ref(0);
    const currentStreak = ref(0);
    const maxStreak = ref(0);
    const guessDistribution = ref<number[]>([]); // 动态与 rows 对齐
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null;
    const userId = currentUser?.id as number | undefined;

    type LeaderboardRow = {
      userId: number;
      played: number;
      wins: number;
      // 展示字段：胜率保留两位小数（字符串）
      winRateStr: string;
      // 排序字段：胜率保留两位小数（数值）
      winRateRounded: number;
    };

    const leaderboardRows = ref<LeaderboardRow[]>([]);
    const indexMethodLeaderboard = (i: number) => i + 1;

    // 单词列表
    const allWords = ref<Array<{ word: string; meaning: string }>>([]);
    const filteredWords = ref<string[]>([]);

    // 计算属性
    const winRate = computed(() => (gamesPlayed.value ? Math.round((gamesWon.value / gamesPlayed.value) * 100) : 0));
    const streak = computed(() => currentStreak.value);
    const difficultyLevel = computed(() => `${difficulty.value}字母`);

    // 当前列数（根据难度）
    const getCurrentCols = () => parseInt(difficulty.value, 10);

    // 当前高亮单元格索引（当 currentCol === 0 时高亮第0格；否则高亮 currentCol）
    const currentActiveIndex = computed(() => {
      const cols = getCurrentCols();
      // 如果当前col指向下一格并等于cols（满了），则高亮最后格
      if (currentCol.value <= 0) return 0;
      return Math.min(currentCol.value, cols - 1);
    });

    // 初始化 guessDistribution 与网格
    const resetGuessDistribution = () => {
      guessDistribution.value = Array(rows).fill(0);
    };

    const loadLeaderboard = async () => {
      leaderboardLoading.value = true;
      try {
        const res = await gameRecordApi.getAllGameRecords();
        const records = (res.data ?? []) as GameRecord[];

        const statMap = new Map<number, { played: number; wins: number }>();
        for (const r of records) {
          const uid = r.userId;
          const prev = statMap.get(uid) ?? { played: 0, wins: 0 };
          prev.played += 1;
          if (r.result === 'win') prev.wins += 1;
          statMap.set(uid, prev);
        }

        const list: LeaderboardRow[] = [...statMap.entries()]
          .map(([uid, s]) => {
            const winRate = s.played ? (s.wins / s.played) * 100 : 0;
            const winRateRounded = Math.round(winRate * 100) / 100; // 两位小数
            return {
              userId: uid,
              played: s.played,
              wins: s.wins,
              winRateRounded,
              winRateStr: `${winRateRounded.toFixed(2)}%`,
            };
          })
          .sort((a, b) => {
            // 胜率高优先；胜率相同则胜利总场数优先
            if (b.winRateRounded !== a.winRateRounded) return b.winRateRounded - a.winRateRounded;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.played - a.played;
          })
          .slice(0, 10);

        leaderboardRows.value = list;
      } catch (e) {
        console.warn('读取排行榜失败', e);
        leaderboardRows.value = [];
      } finally {
        leaderboardLoading.value = false;
      }
    };

    const openLeaderboard = async () => {
      showSettings.value = true;
      await loadLeaderboard();
    };

    const initGameGrid = () => {
      const cols = getCurrentCols();
      gameGrid.value = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ letter: '', status: '' }))
      );
    };

    // 从工具中加载单词
    const fetchEnglishList = async () => {
      try {
        if (vocabularySource.value === 'graduate') {
          // 加载考研词汇
          allWords.value = await loadGraduateWords();
          if (!Array.isArray(allWords.value) || allWords.value.length === 0) {
            ElMessage.error('未能加载单词列表，请检查文件是否存在或格式是否正确');
            return;
          }
          updateFilteredWords();
          ElMessage.success(`成功加载 ${allWords.value.length} 个考研单词`);
        } else {
          // 加载今日学习词汇
          if (!userId) {
            ElMessage.warning('请先登录后再使用今日学习词汇功能');
            return;
          }

          // 获取今天的日期范围
          const today = dayjs().format('YYYY-MM-DD');
          const todayStart = `${today} 00:00:00`;
          const todayEnd = `${today} 23:59:59`;

          // 获取用户今天的所有行为日志
          // const logsRes = await userActionLogApi.getByUserId(userId);
          // const logsRes = await reviewLogApi.getReviewLogByUserId(userId);
          const logsRes = await reviewLogApi.getAllReviewLogs();
          const allLogs = logsRes.data || [];
          console.log('allLogs', allLogs);
          // 过滤今天的学习词汇记录
          const todayLogs = allLogs.filter((log: any) => {
            const logTime = log.lastReview;
            return logTime >= todayStart && logTime <= todayEnd && log.userId == userId;
          });
          console.log(todayLogs);
          if (todayLogs.length === 0) {
            ElMessage.warning('今日暂无学习词汇记录');
            allWords.value = [];
            updateFilteredWords();
            return;
          }

          // 从 actionContent 中提取词汇ID
          const englishIds: number[] = [];
          todayLogs.forEach((log: any) => {
            // const content = log.actionContent || '';
            // // 尝试从 actionContent 中提取 ID，格式可能是 "学习了词汇[ID:123]" 或包含 ID:数字
            // const idMatch = content.match(/ID[:：](\d+)/);
            // if (idMatch) {
            //   const id = parseInt(idMatch[1], 10);
            //   if (!isNaN(id) && !englishIds.includes(id)) {
            //     englishIds.push(id);
            //   }
            // }
            englishIds.push(log.egId);
          });

          if (englishIds.length === 0) {
            ElMessage.warning('无法从学习记录中提取词汇ID');
            allWords.value = [];
            updateFilteredWords();
            return;
          }

          // 获取词汇详情
          const englishRes = await englishApi.getEnglishByIds(englishIds);
          const englishList = englishRes.data || [];
          console.log(englishList, 99999);

          // 过滤只保留 coreKey == '单词' 的词汇
          const wordsOnly = englishList.filter((item: any) => {
            return item.coreKey === '单词';
          });

          // 在控制台打印今日学习词汇
          console.log('今日学习词汇:', wordsOnly.map((item: any) => ({
            id: item.egId,
            word: item.content || item.vocabulary,
            meaning: item.meaning || item.translation,
            coreKey: item.coreKey
          })));

          allWords.value = wordsOnly.map((item: any) => ({
            word: item.content || item.vocabulary,
            meaning: item.meaning || item.translation || '暂无释义'
          }));
          console.log(allWords.value);
          if (allWords.value.length === 0) {
            ElMessage.warning('今日学习词汇中没有符合条件的单词');
          } else {
            ElMessage.success(`成功加载 ${allWords.value.length} 个今日学习单词`);
          }

          updateFilteredWords();
        }
      } catch (err) {
        console.error(err);
        ElMessage.error('获取单词列表失败');
      }
    };

    // 切换词汇来源
    const changeVocabularySource = () => {
      // 保存设置
      localStorage.setItem('wordleVocabularySource', vocabularySource.value);
      // 重新加载词汇
      fetchEnglishList();
      // 开始新游戏
      setTimeout(() => {
        if (filteredWords.value.length > 0) {
          startNewGame();
        }
      }, 500);
    };

    const updateFilteredWords = () => {
      const cols = getCurrentCols();
      filteredWords.value = filterWordsByDifficulty(allWords.value, String(cols)) || [];
      // 保证所有单词均小写
      filteredWords.value = filteredWords.value.map(w => w.toLowerCase());
    };

    // 开始新游戏（只有在 filteredWords 有内容时）
    const startNewGame = () => {
      if (!filteredWords.value || filteredWords.value.length === 0) {
        ElMessage.warning(`没有符合条件的 ${difficulty.value} 字母单词，请选择其他难度或等待单词加载完成`);
        return;
      }

      // 随机选择目标单词（小写）
      const randomIndex = Math.floor(Math.random() * filteredWords.value.length);
      targetWord.value = filteredWords.value[randomIndex];

      // 释义
      const wordObj = allWords.value.find(item => item.word.toLowerCase() === targetWord.value);
      currentWordMeaning.value = wordObj ? wordObj.meaning : '暂无释义';

      // 重置
      gameStatus.value = 'playing';
      currentRow.value = 0;
      currentCol.value = 0;
      shakeRow.value = -1;
      hintsRemaining.value = 2;
      keyStatus.value = {};
      resetGuessDistribution();
      initGameGrid();
      // 注意：为保护游戏答案，正式环境下不要打印 targetWord
      // console.debug('target:', targetWord.value);
    };

    // 按键处理（虚拟键与逻辑键）
    const handleKeyClick = (key: string) => {
      if (gameStatus.value !== 'playing') return;
      const cols = getCurrentCols();

      if (key === 'back') {
        if (currentCol.value > 0) {
          currentCol.value--;
          gameGrid.value[currentRow.value][currentCol.value].letter = '';
          gameGrid.value[currentRow.value][currentCol.value].status = '';
        }
        return;
      }

      if (key === 'enter') {
        submitGuess();
        return;
      }

      // 只接受 a-z 单字母
      if (!/^[a-z]$/.test(key)) return;

      if (currentCol.value < cols) {
        gameGrid.value[currentRow.value][currentCol.value].letter = key;
        // 每次填字将该单元的 status 清空（准备评判）
        gameGrid.value[currentRow.value][currentCol.value].status = '';
        currentCol.value++;
      }
    };

    // 提交猜测
    const submitGuess = () => {
      const cols = getCurrentCols();

      // 若未填满则提示并抖动
      if (currentCol.value !== cols) {
        shakeRow.value = currentRow.value;
        setTimeout(() => (shakeRow.value = -1), 500);
        ElMessage.warning('请填满所有格子');
        return;
      }

      const guess = gameGrid.value[currentRow.value].map(c => c.letter || '').join('').toLowerCase();

      // 检查是否存在于过滤表（有效单词）
      if (!filteredWords.value.includes(guess)) {
        // 将整行标为 incorrect 并抖动
        for (let i = 0; i < cols; i++) {
          gameGrid.value[currentRow.value][i].status = 'incorrect';
        }
        shakeRow.value = currentRow.value;
        setTimeout(() => (shakeRow.value = -1), 500);

        // 如果是最后一行，游戏结束（失败）
        if (currentRow.value === rows - 1) {
          endGameAsLost();
        } else {
          currentRow.value++;
          currentCol.value = 0;
        }
        return;
      }

      // 正常评判单词
      const targetLetters = targetWord.value.split('');
      const guessLetters = guess.split('');
      const letterStatus: Record<string, 'correct' | 'present' | 'absent'> = {};

      // 先标记完全匹配
      for (let i = 0; i < cols; i++) {
        if (guessLetters[i] === targetLetters[i]) {
          gameGrid.value[currentRow.value][i].status = 'correct';
          letterStatus[guessLetters[i]] = 'correct';
          targetLetters[i] = ''; // 标记为已处理
        }
      }

      // 再标记存在但位置不对 / 不存在
      for (let i = 0; i < cols; i++) {
        if (gameGrid.value[currentRow.value][i].status === 'correct') continue;
        const idx = targetLetters.indexOf(guessLetters[i]);
        if (idx !== -1) {
          gameGrid.value[currentRow.value][i].status = 'present';
          // 只有当不是已经标为 correct 时覆盖为 present
          if (letterStatus[guessLetters[i]] !== 'correct') {
            letterStatus[guessLetters[i]] = 'present';
          }
          targetLetters[idx] = '';
        } else {
          gameGrid.value[currentRow.value][i].status = 'absent';
          if (!letterStatus[guessLetters[i]]) letterStatus[guessLetters[i]] = 'absent';
        }
      }

      // 更新键盘状态（优先级： correct > present > absent）
      Object.keys(letterStatus).forEach(k => {
        const newStatus = letterStatus[k];
        const prev = keyStatus.value[k];
        if (
          !prev ||
          (prev !== 'correct' && newStatus === 'correct') ||
          (prev === 'absent' && newStatus !== 'absent')
        ) {
          keyStatus.value[k] = newStatus;
        }
      });

      // 胜利判断
      if (guess === targetWord.value) {
        endGameAsWon();
        return;
      }

      // 若是最后一行也算失败
      if (currentRow.value === rows - 1) {
        endGameAsLost();
        return;
      }

      // 进入下一行
      currentRow.value++;
      currentCol.value = 0;
    };

    // 游戏结束处理（胜利）
    const endGameAsWon = () => {
      gameStatus.value = 'won';
      gamesWon.value++;
      currentStreak.value++;
      if (currentStreak.value > maxStreak.value) maxStreak.value = currentStreak.value;
      // 统计猜测分布（以当前行作为索引）
      guessDistribution.value[currentRow.value] = (guessDistribution.value[currentRow.value] || 0) + 1;
      gamesPlayed.value++;
      void saveGameRecord('win');
      ElMessage.success('恭喜你猜对了！');
    };

    // 游戏结束处理（失败）
    const endGameAsLost = () => {
      gameStatus.value = 'lost';
      currentStreak.value = 0;
      // 统计失败（放在最后一格位置）
      guessDistribution.value[currentRow.value] = (guessDistribution.value[currentRow.value] || 0) + 1;
      gamesPlayed.value++;
      void saveGameRecord('lose');
      ElMessage.error(`游戏结束！答案是: ${targetWord.value}`);
    };

    // 提示（不会把 currentCol 强制移到提示列）
    const showHint = () => {
      if (hintsRemaining.value <= 0) return;
      const cols = getCurrentCols();
      const unrevealedPositions: number[] = [];
      let filledPositions = 0;

      for (let i = 0; i < cols; i++) {
        if (gameGrid.value[currentRow.value][i].letter) {
          filledPositions++;
          continue;
        }
        // 检查之前行是否有 correct
        let isColumnCorrect = false;
        for (let r = 0; r < currentRow.value; r++) {
          if (gameGrid.value[r][i].status === 'correct') {
            isColumnCorrect = true;
            filledPositions++; // 视为已确定
            break;
          }
        }
        if (!isColumnCorrect) unrevealedPositions.push(i);
      }

      const unfilledCount = cols - filledPositions;
      if (unfilledCount === 1) {
        ElMessage.warning('只剩一个字母了，自己猜猜看吧！');
        return;
      }
      if (unrevealedPositions.length === 0) {
        ElMessage.warning('没有可提示的字母，所有未知列都已提示或已猜对');
        return;
      }

      hintsRemaining.value--;
      const randomPos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
      // 将提示字母填入当前行的对应格，但不改变 currentCol 指针（保持玩家输入位置）
      gameGrid.value[currentRow.value][randomPos].letter = targetWord.value[randomPos];
      // 标记为 present/correct 只是作为视觉提示（不影响最终评判）
      gameGrid.value[currentRow.value][randomPos].status = 'present';
      ElMessage.info(`提示: 第 ${randomPos + 1} 个字母是 ${targetWord.value[randomPos]}`);
    };

    // 切换主题
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      document.documentElement.classList.toggle('dark', isDarkMode.value);
    };

    // 更改难度
    const changeDifficulty = () => {
      // 保存设置
      localStorage.setItem('wordleDifficulty', difficulty.value);
      updateFilteredWords();
      startNewGame();
    };

    // 保存/加载游戏统计（改为 gameRecord 后端记录）
    const applyStatsFromRecords = (records: GameRecord[]) => {
      const sorted = [...records].sort((a, b) => Date.parse(a.createTime) - Date.parse(b.createTime));
      gamesPlayed.value = sorted.length;
      gamesWon.value = sorted.filter(r => r.result === 'win').length;

      let tempCurrentStreak = 0;
      let tempMaxStreak = 0;
      for (const r of sorted) {
        if (r.result === 'win') {
          tempCurrentStreak++;
          if (tempCurrentStreak > tempMaxStreak) tempMaxStreak = tempCurrentStreak;
        } else {
          tempCurrentStreak = 0;
        }
      }
      currentStreak.value = tempCurrentStreak;
      maxStreak.value = tempMaxStreak;
    };

    const loadGameStats = async () => {
      if (userId == null) return;
      try {
        const res = await gameRecordApi.getGameRecordsByUserId(userId);
        const records = (res.data ?? []) as GameRecord[];
        applyStatsFromRecords(records);
      } catch (e) {
        console.warn('读取游戏记录失败', e);
      }
    };

    const saveGameRecord = async (result: 'win' | 'lose') => {
      if (userId == null) return;
      const payload: Omit<GameRecord, 'recordId'> = {
        userId,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        difficulty: Number(difficulty.value),
        result
      };
      try {
        await gameRecordApi.addGameRecord(payload);
        await loadGameStats();
      } catch (e) {
        console.warn('保存游戏记录失败', e);
      }
    };

    // 物理键盘处理（并发的 IME 支持）
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus.value !== 'playing' || isComposing.value) return;
      // 如果焦点在 el-select 内，直接 return
        if ((e.target as HTMLElement).closest('.el-select')) {
          return;
        }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyClick('back');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyClick('enter');
        return;
      }

      // 支持大小写 a-z
      const key = e.key.length === 1 ? e.key.toLowerCase() : '';
      if (key >= 'a' && key <= 'z') {
        e.preventDefault();
        handleKeyClick(key);
      }
    };

    // 处理粘贴（只取字母并截断为当前 cols）
    const handlePaste = (e: ClipboardEvent) => {
      if (gameStatus.value !== 'playing' || isComposing.value) return;
      const text = (e.clipboardData?.getData('text') || '').toLowerCase();
      if (!text) return;
      const cols = getCurrentCols();
      // 只保留字母
      const letters = text.replace(/[^a-z]/g, '').slice(0, cols).split('');
      if (letters.length !== cols) {
        // 不完整粘贴仍允许填充，但不自动提交
        for (let i = 0; i < letters.length && i < cols; i++) {
          gameGrid.value[currentRow.value][i].letter = letters[i];
        }
        currentCol.value = Math.min(letters.length, cols);
        return;
      }
      // 若粘贴完整行则直接填充并提交
      for (let i = 0; i < cols; i++) {
        gameGrid.value[currentRow.value][i].letter = letters[i];
      }
      currentCol.value = cols;
      submitGuess();
    };

    // IME composition 事件
    const handleCompositionStart = () => (isComposing.value = true);
    const handleCompositionEnd = () => (isComposing.value = false);

    // 生命周期
    onMounted(async () => {
      // 先恢复本地设置（难度和词汇来源）
      const localDiff = localStorage.getItem('wordleDifficulty');
      if (localDiff) difficulty.value = localDiff;

      const localVocabSource = localStorage.getItem('wordleVocabularySource') as 'graduate' | 'today' | null;
      if (localVocabSource) vocabularySource.value = localVocabSource;

      // 加载单词并统计
      await fetchEnglishList();
      resetGuessDistribution();
      await loadGameStats();
      initGameGrid();

      // 若有可用单词立即开始游戏
      if (filteredWords.value.length > 0) startNewGame();

      // 事件监听
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('paste', handlePaste);
      window.addEventListener('compositionstart', handleCompositionStart);
      window.addEventListener('compositionend', handleCompositionEnd);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionend', handleCompositionEnd);
    });

    return {
      // state
      gameStatus,
      gameGrid,
      currentRow,
      currentCol,
      currentActiveIndex,
      shakeRow,
      isDarkMode,
      difficulty,
      vocabularySource,
      hintsRemaining,
      targetWord,
      currentWordMeaning,
      showStats,
      showSettings,
      leaderboardLoading,
      leaderboardRows,
      indexMethodLeaderboard,
      // UI
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
      // actions
      handleKeyClick,
      startNewGame,
      showHint,
      openLeaderboard,
      toggleTheme,
      changeDifficulty,
      changeVocabularySource,
      // icons
      RefreshRight,
      DataLine,
      Setting
    };
  }
});
</script>

<style scoped>
.wordle-game {
  max-width: 880px;
  margin: 0 auto;
  padding: 20px;
}
.game-card {
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.game-header h2 {
  margin: 0;
  color: #409eff;
}
.game-stats {
  display: flex;
  gap: 10px;
  align-items: center;
}
.game-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.vocabulary-source {
  margin-bottom: 8px;
}
.vocabulary-source :deep(.el-radio-button__inner) {
  padding: 8px 16px;
  font-weight: 500;
}
.vocabulary-source :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409eff;
  border-color: #409eff;
}
.game-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 18px 0;
  align-items: center;
}
.grid-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.grid-cell {
  width: 56px;
  height: 56px;
  border: 2px solid #d3d3d3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  transition: all 0.18s ease;
  border-radius: 6px;
  background: #fff;
  color: #222;
}
.grid-cell.filled {
  animation: pop 0.18s ease-in-out;
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
  background-color: #f2d0d0;
  border-color: #f2d0d0;
  color: #b00020;
}
.grid-cell.current {
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
  border-color: #409eff;
}
.grid-cell.shake {
  animation: shake 0.5s;
}
@keyframes pop {
  0% { transform: scale(0.98); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.keyboard {
  margin-top: 18px;
}
.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.key {
  min-width: 44px;
  height: 46px;
  border: none;
  border-radius: 6px;
  background-color: #d3d6da;
  color: #000;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  user-select: none;
}
.key:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06); }
.key:active { transform: translateY(0); }
.key.wide { min-width: 78px; }
.key.correct { background-color: #6aaa64; color: #fff; }
.key.present { background-color: #c9b458; color: #fff; }
.key.absent { background-color: #787c7e; color: #fff; }
.game-message { margin-top: 18px; }
.word-meaning { margin-top: 18px; }
.meaning-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card :deep(.el-card__header) {
  padding: 10px 14px;
  font-weight: 600;
  color: #666;
}

.stat-big {
  font-size: 28px;
  font-weight: 800;
  color: #409eff;
  text-align: center;
  padding: 10px 0 14px;
}

.dark-mode { background-color: #121213; color: #ffffff; }
.dark-mode .grid-cell { border-color: #3a3a3c; background: #18181a; color: #fff; }
.dark-mode .key { background-color: #3a3a3c; color: #fff; }
.dark-mode .key.correct { background-color: #538d4e; }
.dark-mode .key.present { background-color: #b59f3b; }
.dark-mode .key.absent { background-color: #3a3a3c; }
.dark-mode .stat-label { color: #d3d3d3; }
.dark-mode .guess-bar-container { background-color: #2b2b2b; }
.dark-mode .guess-bar-fill { background-color: #538d4e; }
</style>
