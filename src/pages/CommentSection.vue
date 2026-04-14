<template>
    <div class="comment-section">
        <h3>评论区</h3>

        <div class="comment-input">
            <textarea v-model="newComment" placeholder="写下你的评论... (支持Markdown语法)" rows="3" aria-label="评论输入框"></textarea>
            <button @click="addComment" :disabled="!newComment.trim() || !currentUser"
                :aria-disabled="!newComment.trim()">
                {{ !currentUser ? '请先登录' : '发表评论' }}
            </button>
        </div>

        <ul class="comment-list" role="list" aria-label="评论列表">
            <li v-for="comment in comments" :key="comment.id" class="comment-item" role="listitem">
                <div class="comment-header">
                    <span class="comment-user">{{ comment.userId }}</span>
                    <span class="comment-time">{{ comment.createTime }}</span>
                </div>
                <div class="comment-content markdown-body" v-html="renderMarkdown(comment.content)"></div>

                <ul class="reply-list" v-if="comment.replies.length" role="list" aria-label="回复列表">
                    <li v-for="reply in comment.replies" :key="reply.id" class="reply-item" role="listitem">
                        <div class="comment-header">
                            <span class="comment-user">{{ reply.userId }}</span>
                            <span class="comment-time">{{ reply.createTime }}</span>
                        </div>
                        <div class="comment-content reply-content">
                            <div v-if="reply.replyTo" class="reply-header">
                                回复 <span class="reply-to">@{{ reply.replyTo }}</span>：
                            </div>
                            <div class="markdown-body" v-html="renderMarkdown(reply.content)"></div>
                        </div>
                        <div class="reply-actions" v-if="currentUser">
                            <button @click="toggleReplyInput(comment.id, reply.id)"
                                :aria-expanded="showReplyInputId === comment.id && showReplyInputReplyId === reply.id">
                                {{ showReplyInputId === comment.id && showReplyInputReplyId === reply.id ? '取消回复' : '回复'
                                }}
                            </button>

                            <div v-if="showReplyInputId === comment.id && showReplyInputReplyId === reply.id"
                                class="reply-input">
                                <textarea v-model="replyContent" placeholder="写回复... (支持Markdown)" rows="2"
                                    aria-label="回复输入框"></textarea>
                                <button @click="addReply(comment.id, reply.userId)" :disabled="!replyContent.trim()"
                                    :aria-disabled="!replyContent.trim()">
                                    发送
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>

                <div class="reply-actions" v-if="currentUser">
                    <button @click="toggleReplyInput(comment.id)" :aria-expanded="showReplyInputId === comment.id">
                        {{ showReplyInputId === comment.id ? '取消回复' : '回复' }}
                    </button>

                    <div v-if="showReplyInputId === comment.id && showReplyInputReplyId === null" class="reply-input">
                        <textarea v-model="replyContent" placeholder="写回复... (支持Markdown)" rows="2" aria-label="回复输入框"></textarea>
                        <button @click="addReply(comment.id, comment.userId)" :disabled="!replyContent.trim()"
                            :aria-disabled="!replyContent.trim()">
                            发送
                        </button>
                    </div>
                </div>
            </li>

            <li v-if="comments.length === 0" class="no-comments">暂无评论，快来抢沙发！</li>
        </ul>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import commentApi from '../api/comment'
import replyApi from '../api/reply'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'github-markdown-css/github-markdown-light.css'

// 配置 marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true // GitHub Flavored Markdown
})

interface FetchedComment {
    id: number
    videoId: number
    userId: number
    content: string
    createTime: string
}

interface Comment extends FetchedComment {
    replies: Reply[]
}

interface Reply {
    id: number
    commentId: number
    userId: number
    content: string
    replyTo?: number
    createTime: string
}

const comments = ref<Comment[]>([])
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const newComment = ref('')
const replyContent = ref('')
const showReplyInputId = ref<number | null>(null)
const showReplyInputReplyId = ref<number | null>(null)

/**
 * 渲染Markdown内容
 */
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  try {
    const html = marked.parse(content) as string
    // 对代码块进行高亮处理
    return html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        try {
          const decodedCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          const highlighted = hljs.highlight(decodedCode, { language: lang }).value
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
        } catch {
          return match
        }
      }
    )
  } catch (error) {
    console.error('Markdown渲染失败:', error)
    return content
  }
}

// 添加评论
async function addComment() {
    if (!newComment.value.trim() || !currentUser) return

    try {
        const response = await commentApi.addComment({
            videoId: props.videoId,
            userId: currentUser.id,
            content: newComment.value,
            createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })

        if (response.status === 200) {
            newComment.value = ''
            await fetchComments()
        }
    } catch (error) {
        console.error('发布评论失败：', error)
    }
}

function toggleReplyInput(commentId: number, replyId?: number) {
    if (showReplyInputId.value === commentId && showReplyInputReplyId.value === (replyId ?? null)) {
        showReplyInputId.value = null
        showReplyInputReplyId.value = null
        replyContent.value = ''
    } else {
        showReplyInputId.value = commentId
        showReplyInputReplyId.value = replyId ?? null
        replyContent.value = ''
    }
}

async function addReply(commentId: number, replyToUserId: number) {
    if (!replyContent.value.trim() || !currentUser) return
    try {
        console.log(commentId, currentUser.id, replyToUserId, replyContent.value)
        const response = await replyApi.addReply({
            commentId: commentId,
            userId: currentUser.id,
            content: replyContent.value,
            replyToUserId: replyToUserId,
            createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })

        if (response.status === 200) {
            replyContent.value = ''
            showReplyInputId.value = null
            showReplyInputReplyId.value = null
            await fetchComments()
        }
    } catch (error) {
        console.error('发送回复失败：', error)
    }
}

const props = defineProps({
    videoId: {
        type: Number,
        required: true
    }
})

async function fetchComments() {
    console.log('fetch comments', props.videoId)
    try {
        const response = await commentApi.getCommentsByVideoId(props.videoId)
        comments.value = response.data

        for (const comment of comments.value) {
            try {
                const repliesResponse = await replyApi.getRepliesByCommentId(comment.id)
                comment.replies = repliesResponse.data || []
            } catch (error) {
                console.error(`获取评论${comment.id}的回复失败`, error)
                comment.replies = []
            }
        }
    } catch (error) {
        console.error('获取评论列表失败：', error)
    }
}
// 监听 videoId 变化
watch(() => props.videoId, (newVideoId, oldVideoId) => {
    if (newVideoId !== oldVideoId) {
        fetchComments()
    }
})
onMounted(() => {
    fetchComments()
})
</script>

<style scoped>
/* 评论区容器 */
.comment-section {
    width: 1000px;
    background: #ffffff;
    border-radius: 12px;
    padding: 24px 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    font-size: 15px;
    color: #2c3e50;
}

.comment-section h3 {
    margin-bottom: 20px;
    font-size: 20px;
    color: #1a1a1a;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 10px;
    font-weight: 600;
    user-select: text;
}

/* 评论输入区 */
.comment-input {
    margin-bottom: 24px;
}

.comment-input textarea {
    width: 100%;
    resize: vertical;
    min-height: 80px;
    max-height: 150px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
    color: #374151;
    user-select: text;
    line-height: 1.6;
}

.comment-input textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.comment-input button {
    margin-top: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    color: white;
    font-weight: 500;
    border-radius: 8px;
    padding: 10px 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    user-select: none;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.comment-input button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    box-shadow: none;
}

.comment-input button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

/* 评论列表 */
.comment-list {
    margin-top: 16px;
    overflow-y: auto;
    max-height: 500px;
    list-style: none;
    padding: 0;
    user-select: text;
}

.comment-item {
    margin-bottom: 24px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 10px;
    border: 1px solid #f3f4f6;
    transition: all 0.3s ease;
}

.comment-item:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
}

.comment-header {
    font-size: 13px;
    color: #6b7280;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
}

.comment-user {
    font-weight: 600;
    color: #3b82f6;
    user-select: text;
    font-size: 14px;
}

.comment-time {
    color: #9ca3af;
    font-size: 12px;
}

/* 评论内容 */
.comment-content {
    font-size: 15px;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.8;
}

.reply-content {
    margin-top: 4px;
}

.reply-header {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 6px;
}

/* Markdown样式优化 */
.markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.8;
    color: #374151;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: 600;
    line-height: 1.3;
    color: #1f2937;
}

.markdown-body h1 { font-size: 1.6em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.4em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.2em; }

.markdown-body p {
    margin: 0.8em 0;
    line-height: 1.8;
}

.markdown-body code {
    padding: 0.2em 0.4em;
    margin: 0 2px;
    font-size: 85%;
    background-color: #eff6ff;
    color: #1e40af;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    border: 1px solid #dbeafe;
}

.markdown-body pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.5;
    background-color: #1f2937;
    border-radius: 8px;
    margin: 12px 0;
    border: 1px solid #374151;
}

.markdown-body pre code {
    background-color: transparent;
    padding: 0;
    font-size: 100%;
    color: #e5e7eb;
    border: none;
}

.markdown-body .hljs {
    background: transparent;
    padding: 0;
}

.markdown-body blockquote {
    padding: 12px 16px;
    color: #4b5563;
    border-left: 4px solid #3b82f6;
    margin: 12px 0;
    background-color: #eff6ff;
    border-radius: 0 6px 6px 0;
}

.markdown-body ul,
.markdown-body ol {
    padding-left: 2em;
    margin: 10px 0;
}

.markdown-body li {
    margin: 4px 0;
}

.markdown-body a {
    color: #3b82f6;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
}

.markdown-body a:hover {
    color: #2563eb;
    border-bottom-color: #2563eb;
}

.markdown-body img {
    max-width: 100%;
    box-sizing: content-box;
    background-color: #fff;
    border-radius: 8px;
    margin: 12px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    margin: 12px 0;
    width: 100%;
    display: block;
    overflow: auto;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.markdown-body table tr {
    background-color: #fff;
    border-top: 1px solid #e5e7eb;
}

.markdown-body table tr:nth-child(2n) {
    background-color: #f9fafb;
}

.markdown-body table th,
.markdown-body table td {
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
}

.markdown-body table th {
    font-weight: 600;
    background-color: #eff6ff;
    color: #1e40af;
}

.markdown-body hr {
    height: 1px;
    padding: 0;
    margin: 16px 0;
    background-color: #e5e7eb;
    border: 0;
}

/* 回复列表 */
.reply-list {
    margin-top: 12px;
    padding-left: 20px;
    border-left: 3px solid #dbeafe;
    user-select: text;
}

.reply-item {
    margin-bottom: 16px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #f3f4f6;
}

.reply-to {
    color: #3b82f6;
    font-weight: 600;
    user-select: text;
}

/* 回复操作 */
.reply-actions {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.reply-actions button {
    background: transparent;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    padding: 4px 0;
    align-self: flex-start;
    user-select: none;
    transition: color 0.2s ease;
}

.reply-actions button:hover {
    color: #2563eb;
}

.reply-input {
    margin-top: 8px;
}

.reply-input textarea {
    width: 100%;
    resize: vertical;
    min-height: 60px;
    max-height: 120px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
    color: #374151;
    user-select: text;
    line-height: 1.6;
}

.reply-input textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reply-input button {
    margin-top: 8px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    color: white;
    font-weight: 500;
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 13px;
    user-select: none;
    align-self: flex-end;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
}

.reply-input button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    box-shadow: none;
}

.reply-input button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35);
}

/* 无评论提示 */
.no-comments {
    color: #9ca3af;
    text-align: center;
    padding: 40px 0;
    font-size: 15px;
    user-select: text;
}

/* 滚动条美化 */
.comment-list::-webkit-scrollbar {
    width: 6px;
}

.comment-list::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.comment-list::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}
</style>
