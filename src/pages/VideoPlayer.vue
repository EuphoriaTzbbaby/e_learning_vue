<template>
  <div class="video-container">
    <h1>一口气看完《3分钟小故事》完整版合集</h1>
    <div class="video-meta">
      <span class="author">吴越王</span>
      <span class="views">9.8万 浏览</span>
      <span class="date">2025-03-28 22:12:24</span>
      <span class="copyright">未经许可授权，禁止转载</span>
    </div>

    <div class="divider"></div>

    <div class="content">
      <div class="video-player" v-if="currentVideoUrl">
        <video controls :src="currentVideoUrl" autoplay></video>
        <h3 class="now-playing">正在播放: {{ getPureName(currentVideo) }}</h3>
        <p class="tip">关注微信公众号 <span class="highlight">"小猫助手"</span> 获取更多资料</p>
      </div>

      <ul class="video-list" role="list" aria-label="视频列表">
        <li v-for="video in videos" :key="video" @click="playVideo(video)" :class="{ active: video === currentVideo }"
          title="点击播放" tabindex="0" @keydown.enter.prevent="playVideo(video)" @keydown.space.prevent="playVideo(video)"
          role="listitem" aria-current="true">
          {{ getPureName(video) }}
        </li>
      </ul>
    </div>
    <CommentSection />
  </div>
</template>

<script lang="ts" setup>
import CommentSection from './CommentSection.vue'
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
  max-width: 1100px;
  margin: 30px auto;
  padding: 25px 30px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #2c3e50;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.1);
  user-select: none;
}

h1 {
  text-align: center;
  margin-bottom: 12px;
  color: #222;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.video-meta {
  text-align: center;
  margin-bottom: 25px;
  color: #7f8c8d;
  font-size: 14px;
  user-select: text;
}

.video-meta span {
  margin: 0 12px;
  padding: 0 6px;
  position: relative;
}

.video-meta span:not(:last-child)::after {
  content: "•";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(100%, -50%);
  color: #ccc;
}

.divider {
  height: 1px;
  background: #eaeaea;
  margin: 20px 0 30px;
}

.content {
  display: flex;
  gap: 28px;
  justify-content: space-between;
}

.video-player {
  flex: 1.3;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.video-player video {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 14px;
  background: #000;
  aspect-ratio: 16 / 9;
  box-shadow: 0 5px 14px rgb(0 0 0 / 0.25);
  transition: box-shadow 0.3s ease;
}

.video-player video:hover {
  box-shadow: 0 8px 30px rgb(0 0 0 / 0.4);
}

.now-playing {
  margin: 12px 0 6px;
  font-size: 18px;
  color: #34495e;
  font-weight: 600;
}

.tip {
  color: #95a5a6;
  font-size: 15px;
  text-align: center;
  margin-top: 16px;
  user-select: text;
}

.tip .highlight {
  color: #2980b9;
  font-weight: 700;
}

.video-list {
  width: 280px;
  max-height: 620px;
  overflow-y: auto;
  background: #fefefe;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.06);
  list-style: none;
  border: 1px solid #e1e1e1;
  font-size: 15px;
  user-select: text;
}

.video-list li {
  padding: 12px 15px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #34495e;
  box-shadow: inset 0 0 0 0 transparent;
}

.video-list li:hover {
  background-color: #ecf6fd;
  box-shadow: inset 3px 0 0 #2980b9;
  color: #2980b9;
}

.video-list li.active {
  background-color: #2980b9;
  color: #fff;
  box-shadow: inset 3px 0 0 #1c5980;
  font-weight: 700;
}

/* 滚动条美化 */
.video-list::-webkit-scrollbar {
  width: 8px;
}

.video-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.video-list::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>