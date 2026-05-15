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
                    <span class="comment-user">{{ comment.username }}</span>
                    <span class="comment-time">{{ comment.createTime }}</span>
                </div>
                <div class="comment-content markdown-body" v-html="renderMarkdown(comment.content)"></div>

                <ul class="reply-list" v-if="comment.replies.length" role="list" aria-label="回复列表">
                    <li v-for="reply in comment.replies" :key="reply.id" class="reply-item" role="listitem">
                        <div class="comment-header">
                            <span class="comment-user">{{ reply.username }}</span>
                            <span class="comment-time">{{ reply.createTime }}</span>
                        </div>
                        <div class="comment-content reply-content">
                            <div v-if="reply.replyTo" class="reply-header">
                                回复 <span class="reply-to">@{{ reply.replyToUsername }}</span>：
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
import usersApi from '../api/users'
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
    username?: string
    content: string
    createTime: string
}

interface Comment extends FetchedComment {
    username: string
    replies: Reply[]
}

interface Reply {
    id: number
    commentId: number
    userId: number
    username: string
    content: string
    replyTo?: number
    replyToUsername?: string
    createTime: string
}

const comments = ref<Comment[]>([])
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
// 用户名缓存：userId -> username
const userMap = ref<Map<number, string>>(new Map())
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

// 获取所有用户信息并缓存
async function fetchUsers() {
    try {
        const response = await usersApi.getAllUsers()
        const users = response.data || []
        for (const user of users) {
            userMap.value.set(user.id, user.username)
        }
    } catch (error) {
        console.error('获取用户列表失败：', error)
    }
}

async function fetchComments() {
    console.log('fetch comments', props.videoId)
    try {
        // 先获取所有用户信息
        await fetchUsers()
        
        const response = await commentApi.getCommentsByVideoId(props.videoId)
        comments.value = response.data || []

        for (const comment of comments.value) {
            // 为评论添加用户名
            comment.username = userMap.value.get(comment.userId) || `用户${comment.userId}`
            
            try {
                const repliesResponse = await replyApi.getRepliesByCommentId(comment.id)
                const replies = repliesResponse.data || []
                
                // 为回复添加用户名和回复目标用户名
                for (const reply of replies) {
                    reply.username = userMap.value.get(reply.userId) || `用户${reply.userId}`
                    if (reply.replyTo) {
                        reply.replyToUsername = userMap.value.get(reply.replyTo) || `用户${reply.replyTo}`
                    }
                }
                
                comment.replies = replies
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
/* ========== 评论区容器 ========== */
.comment-section {
    width: 100%;
    max-width: 900px;
    background: #ffffff;
    border-radius: 20px;
    padding: 32px;
    box-shadow: 
        0 4px 24px rgba(102, 126, 234, 0.08),
        0 1px 2px rgba(102, 126, 234, 0.06);
    display: flex;
    flex-direction: column;
    font-size: 15px;
    color: #4a5568;
    border: 1px solid rgba(226, 232, 240, 0.8);
}

/* 标题样式 */
.comment-section h3 {
    margin-bottom: 24px;
    font-size: 22px;
    color: #4a5568;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
    user-select: text;
}

.comment-section h3::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 28px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;
}

/* ========== 评论输入区 ========== */
.comment-input {
    margin-bottom: 32px;
    position: relative;
}

.comment-input textarea {
    width: 100%;
    resize: vertical;
    min-height: 100px;
    max-height: 200px;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 16px 18px;
    font-size: 15px;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
    color: #4a5568;
    user-select: text;
    line-height: 1.7;
    background: #ffffff;
}

.comment-input textarea:focus {
    border-color: #667eea;
    box-shadow: 
        0 0 0 4px rgba(102, 126, 234, 0.12),
        0 4px 12px rgba(102, 126, 234, 0.08);
}

.comment-input textarea::placeholder {
    color: #94a3b8;
}

.comment-input button {
    margin-top: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-weight: 600;
    border-radius: 12px;
    padding: 12px 28px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 15px;
    user-select: none;
    box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
    float: right;
}

.comment-input button:disabled {
    background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
    cursor: not-allowed;
    box-shadow: none;
}

.comment-input button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
}

.comment-input button:active:not(:disabled) {
    transform: translateY(0);
}

/* ========== 评论列表 ========== */
.comment-list {
    margin-top: 16px;
    overflow-y: auto;
    max-height: 600px;
    list-style: none;
    padding: 0;
    user-select: text;
}

/* 无评论提示 */
.no-comments {
    color: #94a3b8;
    text-align: center;
    padding: 50px 0;
    font-size: 16px;
    user-select: text;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.no-comments::before {
    content: '💬';
    font-size: 48px;
    opacity: 0.6;
}

/* ========== 评论项 ========== */
.comment-item {
    margin-bottom: 24px;
    padding: 24px;
    background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.comment-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.comment-item:hover {
    border-color: rgba(102, 126, 234, 0.3);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
}

.comment-item:hover::before {
    opacity: 1;
}

/* 评论头部 */
.comment-header {
    font-size: 13px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #e2e8f0;
}

.comment-user {
    font-weight: 600;
    color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    user-select: text;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

.comment-user::before {
    content: '';
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.comment-time {
    color: #94a3b8;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.comment-time::before {
    content: '🕐';
    font-size: 12px;
}

/* 评论内容 */
.comment-content {
    font-size: 15px;
    color: #475569;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.8;
    padding: 4px 0;
}

.reply-content {
    margin-top: 8px;
    padding-left: 16px;
    border-left: 3px solid linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-left: 3px solid #c7d2fe;
}

.reply-header {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.reply-to {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
}

/* ========== 回复列表 ========== */
.reply-list {
    margin-top: 20px;
    padding-left: 24px;
    border-left: 3px solid #e2e8f0;
    position: relative;
}

.reply-list::before {
    content: '';
    position: absolute;
    left: -3px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;
}

.reply-item {
    margin-bottom: 16px;
    padding: 16px 20px;
    background: linear-gradient(145deg, #fafbfc 0%, #f1f5f9 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
}

.reply-item:hover {
    border-color: #c7d2fe;
    background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%);
}

/* ========== 回复操作 ========== */
.reply-actions {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reply-actions button {
    background: transparent;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    align-self: flex-start;
    user-select: none;
    transition: all 0.2s ease;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.reply-actions button::before {
    content: '↩';
    font-size: 14px;
}

.reply-actions button:hover {
    color: #764ba2;
    background: rgba(102, 126, 234, 0.08);
}

/* 回复输入框 */
.reply-input {
    margin-top: 10px;
}

.reply-input textarea {
    width: 100%;
    resize: vertical;
    min-height: 70px;
    max-height: 130px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
    font-family: inherit;
    color: #4a5568;
    user-select: text;
    line-height: 1.6;
    background: #ffffff;
}

.reply-input textarea:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.reply-input button {
    margin-top: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-weight: 600;
    border-radius: 10px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 14px;
    user-select: none;
    align-self: flex-end;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.reply-input button:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    box-shadow: none;
}

.reply-input button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(102, 126, 234, 0.4);
}

/* ========== Markdown 样式优化 ========== */
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
    font-weight: 700;
    line-height: 1.3;
    color: #4a5568;
}

.markdown-body h1 { font-size: 1.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.3em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.15em; }

.markdown-body p {
    margin: 0.8em 0;
    line-height: 1.8;
}

.markdown-body code {
    padding: 0.2em 0.5em;
    margin: 0 3px;
    font-size: 88%;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    color: #7c3aed;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    border: 1px solid #e2e8f0;
}

.markdown-body pre {
    padding: 18px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.6;
    background: #f8fafc;
    border-radius: 12px;
    margin: 16px 0;
    border: 1px solid #e2e8f0;
}

.markdown-body pre code {
    background-color: transparent;
    padding: 0;
    font-size: 100%;
    color: #7c3aed;
    border: none;
}

.markdown-body blockquote {
    padding: 14px 18px;
    color: #64748b;
    border-left: 4px solid #667eea;
    margin: 16px 0;
    background: linear-gradient(145deg, #faf5ff 0%, #f3e8ff 100%);
    border-radius: 0 10px 10px 0;
    font-style: italic;
}

.markdown-body ul,
.markdown-body ol {
    padding-left: 1.8em;
    margin: 12px 0;
}

.markdown-body li {
    margin: 6px 0;
}

.markdown-body a {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
}

.markdown-body a:hover {
    opacity: 0.8;
}

.markdown-body img {
    max-width: 100%;
    box-sizing: content-box;
    background-color: #fff;
    border-radius: 12px;
    margin: 16px 0;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    margin: 16px 0;
    width: 100%;
    display: block;
    overflow: auto;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.markdown-body table tr {
    background-color: #fff;
    border-top: 1px solid #e2e8f0;
}

.markdown-body table tr:nth-child(2n) {
    background-color: #fafbfc;
}

.markdown-body table th,
.markdown-body table td {
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
}

.markdown-body table th {
    font-weight: 700;
    background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
    color: #475569;
}

.markdown-body hr {
    height: 2px;
    padding: 0;
    margin: 20px 0;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    border: none;
    border-radius: 2px;
}

/* ========== 滚动条美化 ========== */
.comment-list::-webkit-scrollbar {
    width: 8px;
}

.comment-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.comment-list::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
}

.comment-list::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #5a6fd6 0%, #6b4190 100%);
}
</style>
