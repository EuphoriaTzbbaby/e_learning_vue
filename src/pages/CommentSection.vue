<template>
    <div class="comment-section">
        <h3>评论区</h3>

        <div class="comment-input">
            <textarea v-model="newComment" placeholder="写下你的评论..." rows="3" aria-label="评论输入框"></textarea>
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
                <div class="comment-content">{{ comment.content }}</div>

                <ul class="reply-list" v-if="comment.replies.length" role="list" aria-label="回复列表">
                    <li v-for="reply in comment.replies" :key="reply.id" class="reply-item" role="listitem">
                        <div class="comment-header">
                            <span class="comment-user">{{ reply.userId }}</span>
                            <span class="comment-time">{{ reply.createTime }}</span>
                        </div>
                        <div class="comment-content">
                            <template v-if="reply.replyTo">
                                回复 <span class="reply-to">@{{ reply.replyTo }}</span>：{{ reply.content }}
                            </template>
                            <template v-else>
                                {{ reply.content }}
                            </template>
                        </div>
                        <div class="reply-actions" v-if="currentUser">
                            <button @click="toggleReplyInput(comment.id, reply.id)"
                                :aria-expanded="showReplyInputId === comment.id && showReplyInputReplyId === reply.id">
                                {{ showReplyInputId === comment.id && showReplyInputReplyId === reply.id ? '取消回复' : '回复'
                                }}
                            </button>

                            <div v-if="showReplyInputId === comment.id && showReplyInputReplyId === reply.id"
                                class="reply-input">
                                <textarea v-model="replyContent" placeholder="写回复..." rows="2"
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
                        <textarea v-model="replyContent" placeholder="写回复..." rows="2" aria-label="回复输入框"></textarea>
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
/* 保持原有样式不变 */
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
