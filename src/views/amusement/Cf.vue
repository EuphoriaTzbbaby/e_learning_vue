<template>
    <div class="cf-container">
      <header class="cf-header">
        <h1 class="cf-title">Codeforces Submission Viewer</h1>
        <div class="cf-search">
          <input
            v-model="handle"
            type="text"
            placeholder="Enter Codeforces handle"
            class="cf-input"
            @keyup.enter="fetchSubmissions"
          />
          <button 
            @click="fetchSubmissions" 
            :disabled="loading"
            class="cf-button cf-button-primary"
          >
            <span v-if="loading" class="cf-spinner"></span>
            {{ loading ? 'Loading...' : 'Fetch Submissions' }}
          </button>
        </div>
      </header>
  
      <div v-if="error" class="cf-alert cf-alert-error">
        {{ error }}
      </div>
  
      <div class="cf-controls">
        <button 
          @click="toggleSortByRating" 
          :disabled="!submissions.length"
          class="cf-button"
        >
          <span class="cf-sort-icon">
            {{ sortOrder === 'asc' ? '↑' : sortOrder === 'desc' ? '↓' : '↕' }}
          </span>
          Sort by Rating
        </button>
      </div>
  
      <div class="cf-content">
        <div v-if="loading && !submissions.length" class="cf-loading">
          Loading submissions...
        </div>
  
        <div v-else-if="!submissions.length && handle" class="cf-empty">
          No accepted submissions found for {{ handle }}
        </div>
  
        <div v-else-if="submissions.length" class="cf-submissions">
          <table class="cf-table">
            <thead>
              <tr>
                <th @click="sortBy('problem')">Problem</th>
                <th @click="sortBy('rating')">Rating</th>
                <th>Language</th>
                <th>Verdict</th>
                <th @click="sortBy('time')">Submission Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="submission in paginatedSubmissions" :key="submission.id">
                <td>
                  <a 
                    :href="`https://codeforces.com/problemset/problem/${submission.problem.contestId}/${submission.problem.index}`"
                    target="_blank"
                    class="cf-problem-link"
                  >
                    <span class="cf-problem-id">{{ submission.problem.contestId }}{{ submission.problem.index }}</span>
                    <span class="cf-problem-name">{{ submission.problem.name }}</span>
                  </a>
                </td>
                <td>
                  <span :class="['cf-rating', getRatingClass(submission.problem.rating)]">
                    {{ submission.problem.rating || 'N/A' }}
                  </span>
                </td>
                <td class="cf-language">
                  {{ submission.programmingLanguage }}
                </td>
                <td>
                  <span class="cf-verdict cf-verdict-accepted">Accepted</span>
                </td>
                <td class="cf-time">
                  {{ formatTime(submission.creationTimeSeconds) }}
                </td>
              </tr>
            </tbody>
          </table>
  
          <div v-if="totalPages > 1" class="cf-pagination">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="cf-button"
            >
              Previous
            </button>
            <div class="cf-page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="{ 'cf-button-active': page === currentPage }"
                class="cf-page-button"
              >
                {{ page }}
              </button>
            </div>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="cf-button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'
  
  interface Problem {
    contestId: number
    index: string
    name: string
    rating?: number
  }
  
  interface Submission {
    id: number
    problem: Problem
    programmingLanguage: string
    verdict: string
    creationTimeSeconds: number
  }
  
  const handle = ref('')
  const submissions = ref<Submission[]>([])
  const loading = ref(false)
  const error = ref('')
  const currentPage = ref(1)
  const itemsPerPage = 10
  const sortOrder = ref<'none' | 'asc' | 'desc'>('none')
  const problemRatings = ref<Map<string, number>>(new Map())
  
  // 获取题目评分
  const fetchProblemRatings = async () => {
    try {
      const response = await axios.get('/cf-api/problemset.problems')
      if (response.data.status !== 'OK') {
        throw new Error('Failed to fetch problem ratings')
      }
      response.data.result.problems.forEach((problem: Problem) => {
        if (problem.rating) {
          const key = `${problem.contestId}${problem.index}`
          problemRatings.value.set(key, problem.rating)
        }
      })
    } catch (err) {
      console.error('Failed to fetch problem ratings:', err)
      error.value = 'Failed to load problem ratings (some ratings may be missing)'
    }
  }
  
  // 获取用户提交记录
  const fetchSubmissions = async () => {
    if (!handle.value.trim()) {
      error.value = 'Please enter a valid handle'
      return
    }
  
    loading.value = true
    error.value = ''
    submissions.value = []
    currentPage.value = 1
    sortOrder.value = 'none'
  
    try {
      const response = await axios.get(`/cf-api/user.status?handle=${handle.value}`)
      if (response.data.status !== 'OK') throw new Error('API request failed')
  
      submissions.value = response.data.result
        .filter((sub: Submission) => sub.verdict === 'OK')
        .map((sub: Submission) => {
          const key = `${sub.problem.contestId}${sub.problem.index}`
          return {
            ...sub,
            problem: {
              ...sub.problem,
              rating: problemRatings.value.get(key)
            }
          }
        })
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
      error.value = 'Failed to fetch submissions. Please check the handle and try again.'
    } finally {
      loading.value = false
    }
  }
  
  // 排序功能
  const toggleSortByRating = () => {
    sortOrder.value = 
      sortOrder.value === 'none' ? 'asc' :
      sortOrder.value === 'asc' ? 'desc' : 'none'
    currentPage.value = 1
  }
  
  const sortBy = (field: string) => {
    // 可以扩展其他排序字段
    if (field === 'rating') {
      toggleSortByRating()
    }
  }
  
  // 分页计算
  const totalPages = computed(() => Math.ceil(submissions.value.length / itemsPerPage))
  const paginatedSubmissions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return sortedSubmissions.value.slice(start, start + itemsPerPage)
  })
  
  const visiblePages = computed(() => {
    const maxVisible = 5
    const start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages.value, start + maxVisible - 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })
  
  // 排序后的提交记录
  const sortedSubmissions = computed(() => {
    if (sortOrder.value === 'none') return submissions.value
    
    return [...submissions.value].sort((a, b) => {
      const ratingA = a.problem.rating ?? 0
      const ratingB = b.problem.rating ?? 0
      return sortOrder.value === 'asc' ? ratingA - ratingB : ratingB - ratingA
    })
  })
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 获取评分对应的CSS类
  const getRatingClass = (rating?: number) => {
    if (!rating) return 'cf-rating-unrated'
    if (rating < 1200) return 'cf-rating-newbie'
    if (rating < 1400) return 'cf-rating-pupil'
    if (rating < 1600) return 'cf-rating-specialist'
    if (rating < 1900) return 'cf-rating-expert'
    if (rating < 2100) return 'cf-rating-candidate-master'
    if (rating < 2300) return 'cf-rating-master'
    if (rating < 2400) return 'cf-rating-international-master'
    return 'cf-rating-grandmaster'
  }
  
  // 初始化时加载题目评分
  onMounted(fetchProblemRatings)
  </script>
  
  <style scoped>
  /* 基础样式 */
  .cf-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
  }
  
  .cf-header {
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .cf-title {
    font-size: 2rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
  }
  
  .cf-search {
    display: flex;
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .cf-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.3s;
  }
  
  .cf-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  /* 按钮样式 */
  .cf-button {
    padding: 0.75rem 1.5rem;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .cf-button:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #ced4da;
  }
  
  .cf-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .cf-button-primary {
    background-color: #3498db;
    color: white;
    border-color: #3498db;
  }
  
  .cf-button-primary:hover:not(:disabled) {
    background-color: #2980b9;
    border-color: #2980b9;
  }
  
  .cf-button-active {
    background-color: #3498db;
    color: white;
  }
  
  /* 加载动画 */
  .cf-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* 表格样式 */
  .cf-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .cf-table th {
    background-color: #f8f9fa;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
  }
  
  .cf-table th:hover {
    background-color: #e9ecef;
  }
  
  .cf-table td {
    padding: 1rem;
    border-top: 1px solid #eee;
  }
  
  .cf-table tr:hover td {
    background-color: #f8f9fa;
  }
  
  /* 问题链接样式 */
  .cf-problem-link {
    color: inherit;
    text-decoration: none;
    display: flex;
    flex-direction: column;
  }
  
  .cf-problem-id {
    font-weight: 600;
    color: #3498db;
  }
  
  .cf-problem-name {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }
  
  /* 评分样式 */
  .cf-rating {
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .cf-rating-unrated {
    color: #999;
  }
  
  .cf-rating-newbie {
    color: #808080;
  }
  
  .cf-rating-pupil {
    color: #008000;
  }
  
  .cf-rating-specialist {
    color: #03a89e;
  }
  
  .cf-rating-expert {
    color: #0000ff;
  }
  
  .cf-rating-candidate-master {
    color: #aa00aa;
  }
  
  .cf-rating-master {
    color: #ff8c00;
  }
  
  .cf-rating-international-master {
    color: #ff0000;
  }
  
  .cf-rating-grandmaster {
    color: #ff0000;
    font-weight: 800;
  }
  
  /* 判题结果样式 */
  .cf-verdict {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .cf-verdict-accepted {
    background-color: rgba(0, 200, 83, 0.1);
    color: #00c853;
  }
  
  /* 分页样式 */
  .cf-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }
  
  .cf-page-numbers {
    display: flex;
    gap: 0.25rem;
  }
  
  .cf-page-button {
    min-width: 2.5rem;
    padding: 0.5rem;
  }
  
  /* 空状态样式 */
  .cf-empty, .cf-loading {
    text-align: center;
    padding: 2rem;
    color: #666;
    background-color: #f8f9fa;
    border-radius: 4px;
  }
  
  /* 警告提示 */
  .cf-alert {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
  }
  
  .cf-alert-error {
    background-color: rgba(255, 0, 0, 0.1);
    color: #d32f2f;
    border: 1px solid rgba(211, 47, 47, 0.2);
  }
  
  /* 排序图标 */
  .cf-sort-icon {
    margin-right: 0.5rem;
    font-weight: bold;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .cf-search {
      flex-direction: column;
    }
    
    .cf-table {
      display: block;
      overflow-x: auto;
    }
    
    .cf-pagination {
      flex-wrap: wrap;
    }
  }
  </style>