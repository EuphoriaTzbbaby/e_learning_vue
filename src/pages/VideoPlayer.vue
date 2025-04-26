<template>
  <div class="video-container">
    <h1>一口气看完《3分钟小故事》完整版合集</h1>
    <div class="video-meta">
      <span class="author">吴越王</span>
      <span class="views">9.8万</span>
      <span class="date">2025-03-28 22:12:24</span>
      <span class="copyright">未经许可授权，禁止转载</span>
    </div>

    <div class="divider"></div>

    <div class="content">
      <div class="video-player" v-if="currentVideoUrl">
        <video controls :src="currentVideoUrl" autoplay></video>
        <h3>正在播放: {{ getPureName(currentVideo) }}</h3>
        <p class="tip">关注微信公众号"小猫助手"获取更多资料</p>
      </div>

      <ul class="video-list">
        <li v-for="video in videos" :key="video" @click="playVideo(video)" :class="{ active: video === currentVideo }"
          title="点击播放">
          {{ getPureName(video) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 脚本部分保持不变
import { ref, onMounted } from 'vue'
import { get } from '../utils/axios/index'

const videos = ref<string[]>([])
const currentVideo = ref<string | null>(null)
const currentVideoUrl = ref<string>('')

const ossBaseUrl = 'https://cwwdka.oss-cn-beijing.aliyuncs.com/'
const prefix = 'e_learning/3分钟小故事/'

async function fetchVideoList() {
  try {
    const response = await get('/api/videos', { prefix })
    videos.value = response.data
    if (videos.value.length > 0) {
      playVideo(videos.value[0])
    }
  } catch (error) {
    console.error('获取视频列表失败：', error)
  }
}

function playVideo(videoName: string) {
  currentVideo.value = videoName
  currentVideoUrl.value = ossBaseUrl + encodeURIComponent(videoName)
}

function getPureName(fullPath: string | null) {
  if (!fullPath) return ''
  return fullPath.replace(prefix, '')
}

onMounted(() => {
  fetchVideoList()
})
</script>

<style scoped>
.video-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #333;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #222;
  font-size: 22px;
}

.video-meta {
  text-align: center;
  margin-bottom: 20px;
  color: #999;
  font-size: 14px;
}

.video-meta span {
  margin: 0 8px;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 15px 0;
}

.content {
  display: flex;
  gap: 20px;
}

.video-player {
  flex: 1;
  min-width: 0;
  /* 防止flex item溢出 */
  display: flex;
  flex-direction: column;
}

.video-player video {
  width: 100%;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #000;
  aspect-ratio: 16/9;
}

.video-player h3 {
  margin: 10px 0;
  font-size: 16px;
  color: #444;
}

.tip {
  color: #888;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

.video-list {
  width: 250px;
  max-height: 600px;
  overflow-y: auto;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 10px;
  list-style: none;
}

.video-list li {
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
  font-size: 14px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-list li:hover {
  background-color: #e6f7ff;
}

.video-list li.active {
  background-color: #1890ff;
  color: white;
}

/* 滚动条样式 */
.video-list::-webkit-scrollbar {
  width: 6px;
}

.video-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.video-list::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>