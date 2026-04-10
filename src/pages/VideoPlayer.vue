<template>
  <div class="video-container">
    <h1>一口气看完《{{ title }}》完整版合集</h1>
    <div class="video-meta">
      <span class="author">cww</span>
      <span class="views">9.8万 浏览</span>
      <span class="date">2025-03-28 22:12:24</span>
      <span class="copyright">未经许可授权，禁止转载</span>
    </div>

    <div class="divider"></div>

    <div class="content">
      <div class="video-player" v-if="currentVideoUrl">
        <div class="player-actions">
          <button class="action-btn" :class="{ active: isLiked }" :disabled="!userId" @click="toggleLike">
            {{ isLiked ? '已点赞' : '点赞' }}
          </button>
          <button
            class="action-btn"
            :class="{ active: isFavorited }"
            :disabled="!userId"
            @click="toggleFavorite"
          >
            {{ isFavorited ? '已收藏' : '收藏' }}
          </button>
          <span v-if="!userId" class="login-hint">请先登录后操作</span>
        </div>

        <video
          ref="videoEl"
          controls
          :src="currentVideoUrl"
          autoplay
          @play="handlePlay"
          @seeked="handleSeeked"
          @pause="handlePause"
          @ended="handleEnded"
        ></video>
        <p class="tip">关注微信公众号 <span class="highlight">"小猫助手"</span> 获取更多资料</p>
      </div>

      <ul class="video-list" role="list" aria-label="视频列表">
        <li v-for="video in videos" :key="video.id" @click="playVideo(video)"
          :class="{ active: video === currentVideo }" title="点击播放" tabindex="0"
          @keydown.enter.prevent="playVideo(video)" @keydown.space.prevent="playVideo(video)" role="listitem"
          aria-current="true">
          {{ getPureName(video) }}
        </li>
      </ul>
    </div>

    <!-- 向 CommentSection 传递当前播放视频的 id -->
    <CommentSection v-if="currentVideo" :videoId="currentVideo.id" />
  </div>
</template>

<script lang="ts" setup>
import CommentSection from '../pages/CommentSection.vue'
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import videoApi from '../api/video'
import videoActionApi from '../api/videoAction'
import userActionLogApi from '../api/userActionLog'

interface VideoItem {
  id: number
  title: string
  ossKey: string
  videoUrl?: string
  duration?: number
  sortOrder?: number
}

const route = useRoute()
const albumId = Number(route.query.albumId)
const title = route.query.title
const videos = ref<VideoItem[]>([])
const currentVideo = ref<VideoItem | null>(null)
const currentVideoUrl = ref<string>('')

const ossBaseUrl = 'https://cwwdka.oss-cn-beijing.aliyuncs.com/'

const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser?.id as number | null

const isLiked = ref(false)
const isFavorited = ref(false)
const isLoadingAction = ref(false) // 防止重复点击

const videoEl = ref<HTMLVideoElement | null>(null)
const watchRecordedForSession = ref(false)

// 行为类型常量
const ACTION_TYPE = {
  LIKE: 1,      // 点赞
  FAVORITE: 2   // 收藏
} as const

// 行为状态常量
const ACTION_STATE = {
  ACTIVE: 1,    // 有效（点赞/收藏）
  CANCEL: 0     // 取消
} as const

/**
 * 同步点赞和收藏状态
 */
async function syncLikeAndFavorite() {
  if (!userId || !currentVideo.value?.id) {
    isLiked.value = false
    isFavorited.value = false
    return
  }

  try {
    // 使用 isActive 查询点赞状态
    const likeRes = await videoActionApi.isActive(userId, currentVideo.value.id, ACTION_TYPE.LIKE)
    isLiked.value = likeRes.data === true || likeRes.data === ACTION_STATE.ACTIVE
    
    // 使用 isActive 查询收藏状态
    const favoriteRes = await videoActionApi.isActive(userId, currentVideo.value.id, ACTION_TYPE.FAVORITE)
    isFavorited.value = favoriteRes.data === true || favoriteRes.data === ACTION_STATE.ACTIVE
  } catch (error) {
    console.error('获取点赞/收藏状态失败:', error)
  }
}

/**
 * 切换点赞状态
 */
async function toggleLike() {
  if (!userId || !currentVideo.value?.id || isLoadingAction.value) return
  
  isLoadingAction.value = true
  try {
    const willActive = !isLiked.value
    console.log('点赞操作 - willActive:', willActive, '当前状态:', isLiked.value)
    
    // 先查询是否已有记录（不管 state 是什么）
    const res = await videoActionApi.getOne(userId, currentVideo.value.id, ACTION_TYPE.LIKE)
    console.log('getOne 返回:', res.data)
    const existingRecord = res.data
    
    if (willActive) {
      // 点赞
      if (existingRecord && existingRecord.id) {
        // 已有记录，更新状态为有效
        const updateParams = {
          id: existingRecord.id,
          state: ACTION_STATE.ACTIVE
        }
        console.log('准备调用 updateState, 参数:', updateParams)
        
        try {
          const updateRes = await videoActionApi.updateState(updateParams)
          console.log('updateState 返回:', updateRes)
          console.log('更新完成')
        } catch (updateError) {
          console.error('updateState 调用失败:', updateError)
          throw updateError
        }
      } else {
        // 无记录，新增
        console.log('新增点赞记录')
        await videoActionApi.saveAction({
          userId,
          videoId: currentVideo.value.id,
          actionType: ACTION_TYPE.LIKE,
          state: ACTION_STATE.ACTIVE
        })
        console.log('新增完成')
      }
    } else {
      // 取消点赞
      if (existingRecord && existingRecord.id) {
        const updateParams = {
          id: existingRecord.id,
          state: ACTION_STATE.CANCEL
        }
        console.log('准备调用 updateState, 参数:', updateParams)
        
        try {
          const updateRes = await videoActionApi.updateState(updateParams)
          console.log('updateState 返回:', updateRes)
          console.log('取消完成')
        } catch (updateError) {
          console.error('updateState 调用失败:', updateError)
          throw updateError
        }
      } else {
        console.warn('取消点赞失败：未找到记录')
      }
    }
    
    // 更新本地状态
    isLiked.value = willActive
    console.log('本地状态已更新:', isLiked.value)
  } catch (error) {
    console.error('点赞操作失败:', error)
  } finally {
    isLoadingAction.value = false
  }
}

/**
 * 切换收藏状态
 */
async function toggleFavorite() {
  if (!userId || !currentVideo.value?.id || isLoadingAction.value) return
  
  isLoadingAction.value = true
  try {
    const willActive = !isFavorited.value
    console.log('收藏操作 - willActive:', willActive, '当前状态:', isFavorited.value)
    
    // 先查询是否已有记录（不管 state 是什么）
    const res = await videoActionApi.getOne(userId, currentVideo.value.id, ACTION_TYPE.FAVORITE)
    console.log('getOne 返回:', res.data)
    const existingRecord = res.data
    
    if (willActive) {
      // 收藏
      if (existingRecord && existingRecord.id) {
        // 已有记录，更新状态为有效
        const updateParams = {
          id: existingRecord.id,
          state: ACTION_STATE.ACTIVE
        }
        console.log('准备调用 updateState, 参数:', updateParams)
        
        try {
          const updateRes = await videoActionApi.updateState(updateParams)
          console.log('updateState 返回:', updateRes)
          console.log('更新完成')
        } catch (updateError) {
          console.error('updateState 调用失败:', updateError)
          throw updateError
        }
      } else {
        // 无记录，新增
        console.log('新增收藏记录')
        await videoActionApi.saveAction({
          userId,
          videoId: currentVideo.value.id,
          actionType: ACTION_TYPE.FAVORITE,
          state: ACTION_STATE.ACTIVE
        })
        console.log('新增完成')
      }
    } else {
      // 取消收藏
      if (existingRecord && existingRecord.id) {
        const updateParams = {
          id: existingRecord.id,
          state: ACTION_STATE.CANCEL
        }
        console.log('准备调用 updateState, 参数:', updateParams)
        
        try {
          const updateRes = await videoActionApi.updateState(updateParams)
          console.log('updateState 返回:', updateRes)
          console.log('取消完成')
        } catch (updateError) {
          console.error('updateState 调用失败:', updateError)
          throw updateError
        }
      } else {
        console.warn('取消收藏失败：未找到记录')
      }
    }
    
    // 更新本地状态
    isFavorited.value = willActive
    console.log('本地状态已更新:', isFavorited.value)
  } catch (error) {
    console.error('收藏操作失败:', error)
  } finally {
    isLoadingAction.value = false
  }
}

/**
 * 记录观看行为（暂时保留，可能需要后端支持）
 */
async function recordWatchIfFromBeginning() {
  if (!userId || !currentVideo.value?.id) return
  const el = videoEl.value
  if (!el) return

  // 只有在"从开头开始播放"的场景才记录
  const atBeginning = el.currentTime <= 0.2
  if (!atBeginning) return
  if (watchRecordedForSession.value) return
  watchRecordedForSession.value = true

  // TODO: 如果需要观看记录功能，需要在后端添加相应的接口
  console.log('记录观看:', userId, currentVideo.value.id)
}

async function fetchVideoList() {
  try {
    const response = await videoApi.getVideosByAlbumId(albumId)
    videos.value = response.data // 获取的视频数据数组
    console.log('videos:', videos.value)
    if (videos.value.length > 0) {
      playVideo(videos.value[0]) // 默认播放第一个视频
    }
  } catch (error) {
    console.error('获取视频列表失败：', error)
  }
}

function playVideo(video: VideoItem) {
  currentVideo.value = video
  currentVideoUrl.value = ossBaseUrl + encodeURIComponent(video.ossKey)
  watchRecordedForSession.value = false
}

function getPureName(video: VideoItem | null) {
  if (!video) return ''
  return video.title.slice(0, -4)
}

async function handlePlay() {
  // 打印用户ID、当前时间、视频对象
  if (currentVideo.value) {
    console.log(userId, new Date().toLocaleString(), currentVideo.value)
  }
  
  // 记录用户观看视频行为日志
  await recordUserActionLog()
  
  // 播放后检查是否从开头开始
  await recordWatchIfFromBeginning()
}

/**
 * 记录用户观看视频的行为日志
 */
async function recordUserActionLog() {
  if (!userId || !currentVideo.value?.id) return
  
  try {
    // 获取视频标题（去掉后缀）
    const videoTitle = currentVideo.value.title.slice(0, -4)
    
    // 格式化当前时间
    const currentTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
    
    // 记录到数据库（使用你的实体类结构）
    await userActionLogApi.addLog({
      userId: userId,
      actionType: 'WATCH_VIDEO',
      actionContent: `观看了视频【ID:${currentVideo.value.id}，标题:${videoTitle}】`,
      actionTime: currentTime
    })
    
    console.log('用户行为日志记录成功:', {
      userId,
      videoId: currentVideo.value.id,
      videoTitle,
      time: currentTime
    })
  } catch (error) {
    console.error('记录用户行为日志失败:', error)
  }
}

function handleSeeked() {
  const el = videoEl.value
  if (!el) return
  // 如果 seeked 到开头，允许再次记录（且如果正在播放则立即记录）
  if (el.currentTime <= 0.2) {
    watchRecordedForSession.value = false
    if (!el.paused) {
      void recordWatchIfFromBeginning()
    }
  }
}

function handlePause() {
  const el = videoEl.value
  if (!el) return
  // 如果用户在开头位置暂停，那么下一次继续播放时应该允许再次记录
  if (el.currentTime <= 0.2) {
    watchRecordedForSession.value = false
  }
}

function handleEnded() {
  // 结束后如果用户再次从头播放，允许再次写入
  watchRecordedForSession.value = false
}

onMounted(() => {
  console.log(albumId, title, 9999999999)
  fetchVideoList()
})

watch(
  () => currentVideo.value?.id,
  () => {
    syncLikeAndFavorite()
  },
  { immediate: true }
)
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

.player-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #303133;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.action-btn.active {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-hint {
  color: #909399;
  font-size: 12px;
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
