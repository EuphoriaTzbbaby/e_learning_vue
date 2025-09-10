<template>
  <div class="review-analysis p-6 space-y-6">
    <!-- 日期选择器 -->
    <el-date-picker
      v-model="selectedDate"
      type="date"
      placeholder="选择日期"
      value-format="YYYY-MM-DD"
      @change="fetchLogs"
      class="mb-4"
    />

    <!-- 顶部统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card :class="['stat-card', stat.bg]" shadow="hover">
          <div class="stat-icon">{{ stat.icon }}</div>
          <p class="stat-title">{{ stat.title }}</p>
          <h2 class="stat-number">{{ stat.displayValue }}</h2>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header><b>📊 复习结果分布</b></template>
          <div ref="pieChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header><b>📈 熟悉度分布</b></template>
          <div ref="barChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header><b>📅 近 7 天趋势</b></template>
          <div ref="lineChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索框 -->
    <el-input
      v-model="searchKeyword"
      placeholder="🔍 输入单词或释义搜索"
      clearable
      class="search-box"
    />

    <!-- 复习详情表 -->
    <el-card shadow="hover">
      <template #header><b>📘 {{ selectedDate }} 复习详情</b></template>
      <el-table :data="filteredLogs" stripe border>
        <el-table-column prop="word" label="单词" sortable />
        <el-table-column prop="meaning" label="释义" />
        <el-table-column prop="score" label="结果" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.score === 5" type="success" effect="dark">💯 熟练</el-tag>
            <el-tag v-else-if="row.score === 4" type="primary" effect="dark">✅ 认识</el-tag>
            <el-tag v-else-if="row.score === 2" type="warning" effect="dark">⚠️ 模糊</el-tag>
            <el-tag v-else type="danger" effect="dark">❌ 不认识</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="lastReview"
          label="复习时间"
          width="160"
          :formatter="(row: any) => formatDate(row.lastReview)"
        />
      </el-table>
    </el-card>

    <!-- 最难记的 Top5 -->
    <el-card shadow="hover">
      <template #header><b>🔥 最难记的 Top 5 单词</b></template>
      <el-table :data="hardestWords" stripe border>
        <el-table-column prop="word" label="单词" />
        <el-table-column prop="meaning" label="释义" />
        <el-table-column prop="score" label="得分" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import reviewLogApi from "../../api/reviewLog";
import englishApi from "../../api/english";
import * as echarts from "echarts";

// 数据
const todayLogs = ref<any[]>([]);
const searchKeyword = ref("");
const selectedDate = ref(new Date().toISOString().split("T")[0]);

// 图表 ref
const pieChartRef = ref<HTMLElement | null>(null);
const barChartRef = ref<HTMLElement | null>(null);
const lineChartRef = ref<HTMLElement | null>(null);

let pieChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;

// 获取复习记录（指定日期）
const fetchLogs = async () => {
  const res = await reviewLogApi.getAllReviewLogs();
  const allLogs = res.data || [];

  const logsDay = allLogs.filter((log: any) =>
    log.lastReview.startsWith(selectedDate.value)
  );

  if (logsDay.length === 0) {
    todayLogs.value = [];
    return;
  }

  const egIds = logsDay.map((log: any) => log.egId);
  const englishRes = await englishApi.getEnglishByIds(egIds);
  const englishMap: Record<number, any> = {};
  (englishRes.data || []).forEach((item: any) => {
    englishMap[item.egId] = item;
  });

  todayLogs.value = logsDay.map((log: any) => ({
    ...log,
    word: englishMap[log.egId]?.content || "未知单词",
    meaning: englishMap[log.egId]?.translation || "暂无释义",
  }));
};

// 搜索过滤
const filteredLogs = computed(() => {
  if (!searchKeyword.value) return todayLogs.value;
  return todayLogs.value.filter(
    (log) =>
      log.word.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      log.meaning.includes(searchKeyword.value)
  );
});

// 统计
const rememberedCount = computed(() =>
  todayLogs.value.filter((log) => log.score >= 4).length
);
const forgottenCount = computed(() =>
  todayLogs.value.filter((log) => log.score < 4).length
);
const correctRate = computed(() =>
  todayLogs.value.length
    ? ((rememberedCount.value / todayLogs.value.length) * 100).toFixed(1)
    : 0
);

// 最难记 Top5
const hardestWords = computed(() =>
  [...todayLogs.value]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
);

// 卡片动画（数字增长效果）
const animateNumber = (target: number, duration = 800) => {
  const step = Math.ceil(target / (duration / 16));
  const current = ref(0);
  const timer = setInterval(() => {
    current.value += step;
    if (current.value >= target) {
      current.value = target;
      clearInterval(timer);
    }
  }, 16);
  return current;
};

// 顶部卡片
const stats = computed(() => [
  {
    title: "今日复习",
    value: todayLogs.value.length,
    displayValue: todayLogs.value.length,
    bg: "gradient-blue",
    icon: "📘",
  },
  {
    title: "记住",
    value: rememberedCount.value,
    displayValue: rememberedCount.value,
    bg: "gradient-green",
    icon: "✅",
  },
  {
    title: "没记住",
    value: forgottenCount.value,
    displayValue: forgottenCount.value,
    bg: "gradient-red",
    icon: "❌",
  },
  {
    title: "记住率",
    value: correctRate.value,
    displayValue: correctRate.value + "%",
    bg: "gradient-purple",
    icon: "📈",
  },
]);

// 格式化时间
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// 渲染图表
const renderCharts = () => {
  if (pieChartRef.value && !pieChart) {
    pieChart = echarts.init(pieChartRef.value);
  }
  if (barChartRef.value && !barChart) {
    barChart = echarts.init(barChartRef.value);
  }
  if (lineChartRef.value && !lineChart) {
    lineChart = echarts.init(lineChartRef.value);
  }

  // 饼图
  pieChart?.setOption({
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "70%",
        data: [
          { value: todayLogs.value.filter((l) => l.score === 5).length, name: "熟练" },
          { value: todayLogs.value.filter((l) => l.score === 4).length, name: "认识" },
          { value: todayLogs.value.filter((l) => l.score === 2).length, name: "模糊" },
          { value: todayLogs.value.filter((l) => l.score === 0).length, name: "不认识" },
        ],
        label: { formatter: "{b}: {c} ({d}%)" },
      },
    ],
  });

  // 柱状图
  barChart?.setOption({
    tooltip: {},
    xAxis: {
      type: "category",
      data: ["熟练", "认识", "模糊", "不认识"],
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: [
          todayLogs.value.filter((l) => l.score === 5).length,
          todayLogs.value.filter((l) => l.score === 4).length,
          todayLogs.value.filter((l) => l.score === 2).length,
          todayLogs.value.filter((l) => l.score === 0).length,
        ],
        itemStyle: {
          color: (params: any) => {
            const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
            return colors[params.dataIndex];
          },
        },
        label: { show: true, position: "top" },
      },
    ],
  });

  // 折线图（近 7 天趋势）
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const reviewCounts = dates.map(
    (date) => todayLogs.value.filter((l) => l.lastReview.startsWith(date)).length
  );
  const rememberRates = dates.map((date) => {
    const logs = todayLogs.value.filter((l) => l.lastReview.startsWith(date));
    if (!logs.length) return 0;
    return (logs.filter((l) => l.score >= 4).length / logs.length) * 100;
  });

  lineChart?.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["复习数", "记住率"] },
    xAxis: { type: "category", data: dates },
    yAxis: [{ type: "value" }, { type: "value", min: 0, max: 100 }],
    series: [
      { name: "复习数", type: "line", data: reviewCounts },
      { name: "记住率", type: "line", yAxisIndex: 1, data: rememberRates },
    ],
  });

  window.addEventListener("resize", () => {
    pieChart?.resize();
    barChart?.resize();
    lineChart?.resize();
  });
};

watch(todayLogs, renderCharts);

onMounted(async () => {
  await fetchLogs();
  renderCharts();
});
</script>

<style scoped>
.review-analysis {
  background: linear-gradient(135deg, #f9fafb 0%, #f5f3ff 100%);
  min-height: 100vh;
}

.stat-card {
  text-align: center;
  border-radius: 16px;
  color: white;
  transition: transform 0.2s ease;
}
.stat-card:hover {
  transform: scale(1.05);
}
.stat-icon {
  font-size: 24px;
  margin-bottom: 6px;
}
.stat-title {
  font-size: 14px;
  opacity: 0.9;
}
.stat-number {
  font-size: 26px;
  font-weight: bold;
}

.gradient-blue {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}
.gradient-green {
  background: linear-gradient(135deg, #10b981, #34d399);
}
.gradient-red {
  background: linear-gradient(135deg, #ef4444, #f87171);
}
.gradient-purple {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}

.chart-card {
  border-radius: 16px;
}

.search-box {
  margin: 16px 0;
  width: 260px;
}
</style>
