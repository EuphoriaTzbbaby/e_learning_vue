<template>
  <div class="chat-wrapper">
    <!-- 悬浮宠物按钮 -->
    <div 
      class="pet-trigger" 
      :class="{ 'bounce': showDialog }"
      @click="showDialog = true"
    >
      <img :src="petImg" alt="AI助手" class="trigger-avatar" />
      <span class="trigger-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
      <span class="trigger-tip" v-if="!showDialog">点我聊天</span>
    </div>

    <!-- 聊天对话框 -->
    <Teleport to="body">
      <Transition name="chat-slide">
        <div class="chat-window" v-if="showDialog">
          <!-- 头部 -->
          <div class="chat-header">
            <div class="header-left">
              <img :src="petImg" alt="AI" class="header-avatar" />
              <div class="header-info">
                <span class="header-name">AI 英语助手</span>
                <span class="header-status">
                  <span class="status-dot"></span>
                  在线
                </span>
              </div>
            </div>
            <div class="header-actions">
              <button class="action-btn" @click="clearChat" title="清空聊天">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                </svg>
              </button>
              <button class="action-btn close-btn" @click="showDialog = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 消息区域 -->
          <div class="chat-messages" ref="messagesRef">
            <div class="messages-inner">
              <!-- 欢迎消息 -->
              <div class="welcome-message" v-if="messages.length === 0">
                <img :src="petImg" alt="AI" class="welcome-avatar" />
                <div class="welcome-content">
                  <h3>你好！我是你的 AI 英语助手</h3>
                  <p>我可以帮你：</p>
                  <ul>
                    <li>解答英语学习问题</li>
                    <li>解释语法和词汇</li>
                    <li>提供学习建议</li>
                  </ul>
                </div>
              </div>

              <!-- 消息列表 -->
              <TransitionGroup name="message" tag="div" class="message-list">
                <div 
                  v-for="(msg, index) in messages" 
                  :key="index"
                  :class="['message-item', msg.role]"
                >
                  <div class="message-avatar">
                    <img 
                      v-if="msg.role === 'assistant'" 
                      :src="petImg" 
                      alt="AI" 
                    />
                    <div v-else class="user-avatar-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="message-bubble">
                    <div class="message-text" v-html="formatMessage(msg.content)"></div>
                    <div class="message-time">{{ msg.time }}</div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- 加载指示器 -->
              <div class="loading-indicator" v-if="isLoading">
                <div class="loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷提示 -->
          <div class="quick-prompts" v-if="messages.length === 0">
            <button 
              v-for="prompt in quickPrompts" 
              :key="prompt"
              class="quick-prompt-btn"
              @click="usePrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>

          <!-- 输入区域 -->
          <div class="chat-input-area">
            <div class="input-wrapper">
              <textarea
                v-model="userInput"
                placeholder="输入消息..."
                rows="1"
                @keydown.enter.exact.prevent="sendMessage"
                @input="autoResize"
                ref="inputRef"
              ></textarea>
              <button 
                class="send-btn" 
                @click="sendMessage"
                :disabled="!userInput.trim() || isLoading"
                :class="{ 'active': userInput.trim() }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
            <p class="input-hint">按 Enter 发送，Shift + Enter 换行</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDeepSeekResponse } from '../utils/ds'

const petImg = "/owl.svg"

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
}

// interface Position { x: number; y: number }

const showDialog = ref(false)
const userInput = ref('')
const messages = ref<Message[]>([])
const messagesRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const isLoading = ref(false)
const unreadCount = ref(0)
// const petPosition = ref<Position>({ x: 50, y: 200 })

const quickPrompts = [
  '如何提高英语听力？',
  '解释一下虚拟语气',
  '推荐英语学习资源',
  '英语口语练习技巧'
]

const formatMessage = (content: string) => {
  // 简单格式化：代码块、换行
  return content
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const getTimeString = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
  }
}

const usePrompt = (prompt: string) => {
  userInput.value = prompt
  sendMessage()
}

const clearChat = () => {
  messages.value = []
  ElMessage.success('聊天已清空')
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  const content = userInput.value.trim()
  userInput.value = ''
  
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
  
  messages.value.push({
    role: 'user',
    content,
    time: getTimeString()
  })
  
  await scrollToBottom()
  
  isLoading.value = true
  
  try {
    const response = await getDeepSeekResponse(content, "你是一位英语专家，耐心解答问题，语言生动有趣。")
    messages.value.push({
      role: 'assistant',
      content: response,
      time: getTimeString()
    })
  } catch (error) {
    console.error('API Error:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后重试。',
      time: getTimeString()
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 监听新消息
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > oldLen && !showDialog.value) {
    unreadCount.value++
  }
})

watch(showDialog, (val) => {
  if (val) {
    unreadCount.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

// ESC 关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showDialog.value) {
    showDialog.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* 悬浮按钮 */
.chat-wrapper {
  position: fixed;
  z-index: 9999;
}

.pet-trigger {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10000;
}

.trigger-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
}

.pet-trigger:hover .trigger-avatar {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
}

.pet-trigger.bounce .trigger-avatar {
  animation: none;
}

.trigger-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  box-shadow: 0 2px 10px rgba(245, 108, 108, 0.4);
}

.trigger-tip {
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.pet-trigger:hover .trigger-tip {
  opacity: 1;
  transform: translateX(0);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* 聊天窗口 */
.chat-window {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 400px;
  height: 580px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10001;
}

/* 头部 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-name {
  font-size: 16px;
  font-weight: 600;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.close-btn:hover {
  background: #f56c6c;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  margin-bottom: 10px;
}

.welcome-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  border: 3px solid #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.welcome-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}

.welcome-content p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #909399;
}

.welcome-content ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.welcome-content li {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 消息列表 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.message-item.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar img,
.message-avatar .user-avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.user-avatar-icon svg {
  width: 20px;
  height: 20px;
}

.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.assistant .message-text {
  background: #fff;
  color: #303133;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
  padding: 0 4px;
}

.message-item.user .message-time {
  text-align: right;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  justify-content: flex-start;
  padding: 0 46px;
}

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce-dot 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 快捷提示 */
.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 16px;
  background: #f5f7fa;
}

.quick-prompt-btn {
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-prompt-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 输入区域 */
.chat-input-area {
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #f5f7fa;
  border-radius: 24px;
  padding: 8px 8px 8px 20px;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  background: #ecf5ff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.input-wrapper textarea {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  color: #303133;
  max-height: 120px;
  padding: 4px 0;
}

.input-wrapper textarea::placeholder {
  color: #909399;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #dcdfe6;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.send-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.send-btn.active:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.send-btn:disabled {
  cursor: not-allowed;
}

.input-hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #c0c4cc;
  text-align: center;
}

/* 动画 */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.message-enter-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* 滚动条 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 响应式 */
@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 20px);
    height: calc(100vh - 100px);
    bottom: 90px;
    right: 10px;
    left: 10px;
    border-radius: 20px;
  }

  .pet-trigger {
    right: 20px;
    bottom: 20px;
  }

  .trigger-tip {
    display: none;
  }
}
</style>

<style>
/* 代码块样式 */
.message-text pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.message-text pre code {
  background: none;
  padding: 0;
  color: inherit;
}
</style>
