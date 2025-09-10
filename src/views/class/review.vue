<template>
    <div class="review-analysis p-6">
    <!-- 日期选择器 + 导出按钮 -->
    <el-card shadow="hover" class="filter-card">
        <el-row align="middle" justify="space-between" gutter="12">
        <!-- 左侧 -->
        <el-col :span="12" class="flex items-center gap-3">
            <el-date-picker
            v-model="selectedDate"
            type="date"
            size="large"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            @change="fetchLogs"
            class="date-picker"
            style="width: 240px"
            />
        </el-col>
        <!-- 右侧 -->
        </el-row>
    </el-card>
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="section-gap">
        <el-col :span="12" v-for="stat in stats" :key="stat.title">
        <el-card :class="['stat-card', stat.bg]" shadow="hover" :body-style="{ padding: '20px' }">
            <div class="stat-content">
            <el-icon class="stat-icon"><component :is="stat.icon" /></el-icon>
            <div>
                <p class="stat-title">{{ stat.title }}</p>
                <h2 class="stat-number">
                <transition name="fade-number">
                    <span :key="stat.displayValue">{{ stat.displayValue }}</span>
                </transition>
                </h2>
            </div>
            </div>
        </el-card>
        </el-col>
    </el-row>
    <!-- 图表 -->
    <el-row :gutter="20" class="section-gap">
        <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
            <template #header>
            <div class="chart-header">
                <b>📊 熟悉度分布</b>
                <el-button type="primary" size="large" @click="exportTable" :loading="exportingTable">
                <el-icon><Download /></el-icon>
                <span class="ml-1">导出表格</span>
                </el-button>
            </div>
            </template>
            <div ref="pieChartRef" style="height: 320px;"></div>
        </el-card>
        </el-col>
        <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
            <template #header>
            <div class="chart-header">
                <b>📅 近 7 天趋势</b>
                <el-button type="success" size="large" @click="exportCharts" :loading="exportingCharts">
                <el-icon><Picture /></el-icon>
                <span class="ml-1">导出图表</span>
                </el-button>
            </div>
            </template>
            <div ref="lineChartRef" style="height: 320px;"></div>
        </el-card>
        </el-col>
    </el-row>
    <!-- 搜索框 + 筛选 -->
    <el-card shadow="hover" class="filter-card section-gap">
        <div class="flex items-center justify-between gap-4">
        <el-input
            v-model="searchKeyword"
            placeholder="🔍 输入单词或释义搜索"
            clearable
            class="search-box"
            style="width: 280px"
            @clear="handleSearchClear"
        >
            <template #prefix>
            <el-icon><Search /></el-icon>
            </template>
        </el-input>
        <el-select
            v-model="scoreFilter"
            placeholder="熟悉度筛选"
            clearable
            class="filter-select"
            style="width: 160px"
            @clear="handleFilterClear"
        >
            <el-option label="全部" :value="null" />
            <el-option label="💯 熟练" :value="5" />
            <el-option label="✅ 认识" :value="4" />
            <el-option label="⚠️ 模糊" :value="2" />
            <el-option label="❌ 不认识" :value="0" />
        </el-select>
        </div>
    </el-card>
    <!-- 空状态 -->
    <el-empty
        v-if="todayLogs.length === 0"
        description="今天还没有复习记录"
        class="section-gap"
    >
        <el-button type="primary" @click="fetchLogs">刷新数据</el-button>
    </el-empty>
    <!-- 复习详情表 -->
    <el-card
        v-else
        shadow="hover"
        class="section-gap"
    >
        <template #header>
        <div class="table-header">
            <b>📘 {{ selectedDate }} 复习详情</b>
            <div class="table-actions">
            <el-button size="small" text @click="refreshTable">
                <el-icon><Refresh /></el-icon>
            </el-button>
            </div>
        </div>
        </template>
        <el-table
        :data="paginatedLogs"
        stripe
        border
        highlight-current-row
        class="review-table"
        v-loading="tableLoading"
        element-loading-text="加载中..."
        >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="word" label="单词" sortable min-width="120" />
        <el-table-column prop="meaning" label="释义" min-width="200" />
        <el-table-column prop="score" label="熟悉度" width="200">
            <template #default="{ row }">
            <el-rate
                v-model="row.score"
                disabled
                :colors="['#ef4444', '#f59e0b', '#3b82f6']"
                :max="5"
                show-score
                score-template="{value}"
            />
            </template>
        </el-table-column>
        <el-table-column
            prop="lastReview"
            label="复习时间"
            width="180"
            sortable
            :formatter="(row: any) => formatDate(row.lastReview)"
        />
        </el-table>
        <div class="pagination-container">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="filteredLogs.length"
            layout="sizes, prev, pager, next, jumper"
            background
        />
        </div>
    </el-card>
    <!-- 最难记的 Top5 -->
    <el-card
        v-if="hardestWords.length"
        shadow="hover"
        class="section-gap"
    >
        <template #header><b>🔥 最难记的 Top 5 单词</b></template>
        <el-table :data="hardestWords" stripe border>
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column prop="word" label="单词" />
        <el-table-column prop="meaning" label="释义" />
        <el-table-column prop="score" label="最低得分" />
        <el-table-column prop="reviewCount" label="复习次数" />
        </el-table>
    </el-card>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";
import reviewLogApi from "../../api/reviewLog";
import englishApi from "../../api/english";
import * as echarts from "echarts";
import * as XLSX from "xlsx";
import { Download, Picture, Reading, TrendCharts, Search, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
const allLogs = ref<any[]>([]);
const todayLogs = ref<any[]>([]);
const searchKeyword = ref("");
const scoreFilter = ref<number | null>(null);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const currentPage = ref(1);
const pageSize = ref(10);
const pieChartRef = ref<HTMLElement | null>(null);
const lineChartRef = ref<HTMLElement | null>(null);
let pieChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;
const exportingTable = ref(false);
const exportingCharts = ref(false);
const tableLoading = ref(false);
// // 防抖函数
// const debounce = (fn: Function, delay: number) => {
//     let timer: any;
//     return function (this: any, ...args: any[]) {
//     clearTimeout(timer);
//     timer = setTimeout(() => fn.apply(this, args), delay);
//     };
// };
const fetchLogs = async () => {
    tableLoading.value = true;
    try {
    const res = await reviewLogApi.getAllReviewLogs();
    allLogs.value = res.data || [];
    const logsDay = allLogs.value.filter((log: any) =>
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
    } catch (error) {
    ElMessage.error("获取复习记录失败");
    console.error(error);
    } finally {
    tableLoading.value = false;
    }
};
// 使用防抖优化搜索
// const debouncedFetchLogs = debounce(fetchLogs, 500);
const filteredLogs = computed(() => {
    let logs = todayLogs.value;
    if (scoreFilter.value !== null) logs = logs.filter((l) => l.score === scoreFilter.value);
    if (searchKeyword.value) {
    logs = logs.filter(
        (log) =>
        log.word.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        log.meaning.includes(searchKeyword.value)
    );
    }
    return logs;
});
const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredLogs.value.slice(start, start + pageSize.value);
});
const correctRate = computed(() =>
    todayLogs.value.length
    ? ((todayLogs.value.filter((log) => log.score >= 4).length / todayLogs.value.length) * 100).toFixed(1)
    : 0
);
const hardestWords = computed(() => {
    const grouped: Record<string, { word: string; meaning: string; scores: number[] }> = {};
    todayLogs.value.forEach((log) => {
    if (!grouped[log.word]) grouped[log.word] = { word: log.word, meaning: log.meaning, scores: [] };
    grouped[log.word].scores.push(log.score);
    });
    return Object.values(grouped)
    .map((g) => ({
        ...g,
        score: Math.min(...g.scores),
        reviewCount: g.scores.length,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
});
const stats = computed(() => [
    { title: "今日复习", displayValue: todayLogs.value.length, bg: "gradient-blue", icon: Reading },
    { title: "记住率", displayValue: correctRate.value + "%", bg: "gradient-purple", icon: TrendCharts },
]);
const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(
    d.getMinutes()
    ).padStart(2, "0")}`;
};
const renderCharts = () => {
    if (pieChartRef.value && !pieChart) pieChart = echarts.init(pieChartRef.value);
    if (lineChartRef.value && !lineChart) lineChart = echarts.init(lineChartRef.value);
    // 确保DOM已更新
    nextTick(() => {
    pieChart?.setOption({
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { fontSize: 12 } },
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
            itemStyle: {
            color: (params: any) => ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][params.dataIndex],
            },
            label: { 
            formatter: "{b}: {d}%",
            fontSize: 12
            },
        },
        ],
    });
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
    });
    const reviewCounts = dates.map((date) =>
        allLogs.value.filter((l) => l.lastReview.startsWith(date)).length
    );
    const rememberRates = dates.map((date) => {
        const logs = allLogs.value.filter((l) => l.lastReview.startsWith(date));
        if (!logs.length) return 0;
        return (logs.filter((l) => l.score >= 4).length / logs.length) * 100;
    });
    lineChart?.setOption({
        tooltip: {
        trigger: "axis",
        formatter: (params: any) =>
            `📅 ${params[0].axisValue}<br/>复习数: ${params[0].data}<br/>记住率: ${params[1].data.toFixed(1)}%`,
        },
        legend: { 
        data: ["复习数", "记住率"],
        textStyle: { fontSize: 12 }
        },
        xAxis: { 
        type: "category", 
        data: dates,
        axisLabel: { fontSize: 10 }
        },
        yAxis: [
        { 
            type: "value",
            name: "复习数",
            nameTextStyle: { fontSize: 10 }
        }, 
        { 
            type: "value", 
            min: 0, 
            max: 100,
            name: "记住率(%)",
            nameTextStyle: { fontSize: 10 },
            axisLabel: { formatter: '{value}%' }
        }
        ],
        series: [
        { 
            name: "复习数", 
            type: "bar", 
            data: reviewCounts, 
            itemStyle: { color: "#3b82f6" },
            barWidth: '40%'
        },
        { 
            name: "记住率", 
            type: "line", 
            yAxisIndex: 1, 
            data: rememberRates, 
            smooth: true, 
            lineStyle: { color: "#10b981", width: 2 },
            symbol: 'circle',
            symbolSize: 6
        },
        ],
    });
    // 使用ResizeObserver优化图表响应
    if (pieChartRef.value) {
        const pieObserver = new ResizeObserver(() => pieChart?.resize());
        pieObserver.observe(pieChartRef.value);
    }
    if (lineChartRef.value) {
        const lineObserver = new ResizeObserver(() => lineChart?.resize());
        lineObserver.observe(lineChartRef.value);
    }
    });
};
watch([todayLogs, allLogs], renderCharts, { deep: true });
onMounted(async () => {
    await fetchLogs();
    renderCharts();
});
/** 导出表格 */
const exportTable = async () => {
    if (!todayLogs.value.length) {
    ElMessage.warning("暂无数据可导出");
    return;
    }
    exportingTable.value = true;
    try {
    const data = todayLogs.value.map((l) => ({
        单词: l.word,
        释义: l.meaning,
        熟悉度: l.score === 5 ? "💯 熟练" : l.score === 4 ? "✅ 认识" : l.score === 2 ? "⚠️ 模糊" : "❌ 不认识",
        复习时间: formatDate(l.lastReview),
    }));
    const ws = XLSX.utils.json_to_sheet(data, { header: ["单词", "释义", "熟悉度", "复习时间"] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "复习详情");
    XLSX.writeFile(wb, `复习详情_${selectedDate.value}.xlsx`);
    ElMessage.success("表格已导出 ✅");
    } catch (error) {
    ElMessage.error("导出失败");
    console.error(error);
    } finally {
    exportingTable.value = false;
    }
};
/** 导出图表 */
const exportCharts = () => {
    if (pieChart) downloadChart(pieChart, "熟悉度分布.png");
    if (lineChart) downloadChart(lineChart, "近7天趋势.png");
    ElMessage.success("图表已导出 ✅");
};
const downloadChart = (chart: echarts.ECharts | null, filename: string) => {
    if (!chart) return;
    const dataUrl = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
const handleSearchClear = () => {
    searchKeyword.value = "";
    fetchLogs();
};
const handleFilterClear = () => {
    scoreFilter.value = null;
    fetchLogs();
};
const refreshTable = () => {
    fetchLogs();
};
</script>
<style scoped>
.review-analysis {
    background: linear-gradient(135deg, #f9fafb 0%, #f5f3ff 100%);
    min-height: 100vh;
}
/* 统一区块间距 */
.section-gap {
    margin-bottom: 24px;
}
.filter-card {
    border-radius: 16px;
    padding: 12px 20px;
}
/* 搜索框和下拉筛选美化 */
.search-box,
.filter-select {
    border-radius: 12px;
    transition: box-shadow 0.2s;
}
.search-box:deep(.el-input__inner),
.filter-select:deep(.el-input__inner) {
    border-radius: 12px;
}
.search-box:focus-within,
.filter-select:focus-within {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
/* 统计卡片 */
.stat-card {
    border-radius: 16px;
    color: white;
    text-align: center;
    padding: 20px;
    transition: transform 0.2s ease;
}
.stat-card:hover {
    transform: translateY(-4px);
}
.stat-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}
.stat-icon {
    font-size: 28px;
}
.stat-title {
    font-size: 14px;
    margin: 0;
    opacity: 0.9;
}
.stat-number {
    font-size: 26px;
    font-weight: bold;
    margin: 4px 0 0;
}
.gradient-blue {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
}
.gradient-purple {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}
/* 图表卡片 */
.chart-card {
    border-radius: 16px;
}
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
/* 表格优化 */
.review-table :deep(.el-table__row:hover) {
    background-color: #f3f4f6;
    transition: 0.3s;
}
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.table-actions {
    display: flex;
    gap: 8px;
}
/* 分页条 */
.pagination-container {
    margin-top: 16px;
    text-align: right;
}
/* 数字过渡动画 */
.fade-number-enter-active,
.fade-number-leave-active {
    transition: all 0.3s ease;
}
.fade-number-enter-from,
.fade-number-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
/* 按钮文字间距 */
.ml-1 {
    margin-left: 4px;
}
</style>