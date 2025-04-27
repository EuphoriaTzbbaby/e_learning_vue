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

    <div class="comment-section">
      <h3>评论区</h3>

      <div class="comment-input">
        <textarea v-model="newComment" placeholder="写下你的评论..." rows="3" aria-label="评论输入框"></textarea>
        <button @click="addComment" :disabled="Boolean(!newComment.trim())"
          :aria-disabled="Boolean(!newComment.trim())">
          发表评论
        </button>
      </div>

      <ul class="comment-list" role="list" aria-label="评论列表">
        <li v-for="comment in comments" :key="comment.id" class="comment-item" role="listitem">
          <div class="comment-header">
            <span class="comment-user">{{ comment.user }}</span>
            <span class="comment-time">{{ comment.time }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>

          <ul class="reply-list" v-if="comment.replies.length" role="list" aria-label="回复列表">
            <li v-for="reply in comment.replies" :key="reply.id" class="reply-item" role="listitem">
              <div class="comment-header">
                <span class="comment-user">{{ reply.user }}</span>
                <span class="comment-time">{{ reply.time }}</span>
              </div>
              <div class="comment-content">
                <template v-if="reply.replyTo">
                  回复 <span class="reply-to">@{{ reply.replyTo }}</span>：{{ reply.content }}
                </template>
                <template v-else>
                  {{ reply.content }}
                </template>
              </div>
            </li>
          </ul>

          <div class="reply-actions">
            <button @click="toggleReplyInput(comment.id)" :aria-expanded="showReplyInputId === comment.id">
              {{ showReplyInputId === comment.id ? '取消回复' : '回复' }}
            </button>

            <div v-if="showReplyInputId === comment.id" class="reply-input">
              <textarea v-model="replyContent" placeholder="写回复..." rows="2" aria-label="回复输入框"></textarea>
              <button @click="addReply(comment.id)" :disabled="Boolean(!replyContent.trim())"
                :aria-disabled="Boolean(!replyContent.trim())">
                发送
              </button>
            </div>
          </div>
        </li>

        <li v-if="comments.length === 0" class="no-comments">暂无评论，快来抢沙发！</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
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

interface Comment {
  id: number
  user: string
  content: string
  time: string
  replies: Reply[]
}
interface Reply {
  id: number
  user: string
  content: string
  time: string
  replyTo?: string
}

const comments = ref<Comment[]>([])

const currentUser = '匿名用户'
const newComment = ref('')
const replyContent = ref('')
const showReplyInputId = ref<number | null>(null)

let currentReplyToUser = ''

let commentId = 1
let replyId = 1

function addComment() {
  if (!newComment.value.trim()) return
  comments.value.unshift({
    id: commentId++,
    user: currentUser,
    content: newComment.value.trim(),
    time: new Date().toLocaleString(),
    replies: [],
  })
  newComment.value = ''
  showReplyInputId.value = null
}

function toggleReplyInput(id: number) {
  if (showReplyInputId.value === id) {
    showReplyInputId.value = null
    replyContent.value = ''
    currentReplyToUser = ''
  } else {
    showReplyInputId.value = id
    replyContent.value = ''
    const comment = comments.value.find(c => c.id === id)
    currentReplyToUser = comment ? comment.user : ''
  }
}

function addReply(commentIdToReply: number) {
  if (!replyContent.value.trim()) return
  const targetComment = comments.value.find(c => c.id === commentIdToReply)
  if (targetComment) {
    targetComment.replies.push({
      id: replyId++,
      user: currentUser,
      content: replyContent.value.trim(),
      time: new Date().toLocaleString(),
      replyTo: currentReplyToUser,
    })
  }
  replyContent.value = ''
  showReplyInputId.value = null
  currentReplyToUser = ''
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

.comment-section {
  width: 1000px;
  background: #fafafa;
  border-radius: 10px;
  padding: 20px 18px;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.07);
  display: flex;
  flex-direction: column;
  font-size: 15px;
  color: #2c3e50;
}

.comment-section h3 {
  margin-bottom: 16px;
  font-size: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
  font-weight: 700;
  user-select: text;
}

.comment-input textarea {
  width: 100%;
  resize: vertical;
  min-height: 72px;
  max-height: 130px;
  border: 1.8px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.25s ease;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #34495e;
  user-select: text;
}

.comment-input textarea:focus {
  border-color: #2980b9;
  box-shadow: 0 0 8px #74a9d8;
}

.comment-input button {
  margin-top: 10px;
  background-color: #2980b9;
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 6px;
  padding: 9px 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 14px;
  user-select: none;
}

.comment-input button:disabled {
  background-color: #a3c4dc;
  cursor: not-allowed;
}

.comment-input button:hover:not(:disabled) {
  background-color: #1b5d8a;
}

.comment-list {
  margin-top: 20px;
  overflow-y: auto;
  max-height: 460px;
  list-style: none;
  padding: 0;
  user-select: text;
}

.comment-item {
  margin-bottom: 22px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.comment-header {
  font-size: 13px;
  color: #555;
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.comment-user {
  font-weight: 700;
  color: #2980b9;
  user-select: text;
}

.comment-time {
  color: #aaa;
  font-style: italic;
}

.comment-content {
  font-size: 15px;
  color: #34495e;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-list {
  margin-top: 10px;
  padding-left: 18px;
  border-left: 2px solid #dbe9f8;
  user-select: text;
}

.reply-item {
  margin-bottom: 12px;
}

.reply-to {
  color: #2980b9;
  font-weight: 600;
  user-select: text;
}

.reply-actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-actions button {
  background: transparent;
  border: none;
  color: #2980b9;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 0;
  align-self: flex-start;
  user-select: none;
}

.reply-input textarea {
  width: 100%;
  resize: vertical;
  min-height: 48px;
  max-height: 110px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.25s ease;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #34495e;
  user-select: text;
}

.reply-input textarea:focus {
  border-color: #2980b9;
  box-shadow: 0 0 6px #74a9d8;
}

.reply-input button {
  margin-top: 6px;
  background-color: #2980b9;
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 6px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 13px;
  user-select: none;
  align-self: flex-end;
  transition: background-color 0.3s ease;
}

.reply-input button:disabled {
  background-color: #a3c4dc;
  cursor: not-allowed;
}

.reply-input button:hover:not(:disabled) {
  background-color: #1b5d8a;
}

.no-comments {
  color: #999;
  text-align: center;
  padding: 30px 0;
  font-style: italic;
  user-select: text;
}
</style>
