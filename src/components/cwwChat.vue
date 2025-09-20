<template>
  <div class="pet-wrapper">
    <!-- 宠物元素 -->
    <div 
      class="pet" 
      :style="{ left: petPosition.x + 'px', top: petPosition.y + 'px' }"
      @click="showDialog = true"
    >
      <img class="pet-body" :src="petImg" alt="宠物" />

      <!-- 思考气泡 -->
      <div class="pet-talk-bubble" v-if="isThinking">
        <div class="pet-talk-content">思考中...</div>
      </div>
    </div>

    <!-- 聊天对话框 -->
    <el-dialog 
      v-model="showDialog" 
      title="与AI之父吴越聊天" 
      width="520px"
      :before-close="handleClose"
      class="pet-dialog"
    >
      <div class="chat-container">
        <!-- 聊天内容 -->
        <div class="chat-messages" ref="messagesContainer">
          <div 
            v-for="(message, index) in messages" 
            :key="index" 
            :class="['message', message.role]"
          >
            <!-- 宠物消息 -->
            <div class="avatar" v-if="message.role === 'assistant'">
              <img :src="petImg" alt="pet" />
            </div>
            <div class="message-content">{{ message.content }}</div>
            <!-- 用户消息 -->
            <div class="avatar" v-if="message.role === 'user'">
              <img src="https://cwwdka.oss-cn-beijing.aliyuncs.com/pet/fuck.png" alt="user" />
            </div>
          </div>
        </div>
        
        <!-- 输入框 -->
        <div class="chat-input">
          <el-input
            v-model="userInput"
            placeholder="和宠物说点什么吧..."
            size="large"
            @keyup.enter="sendMessage"
          >
            <template #append>
              <el-button type="primary" :icon="Promotion" @click="sendMessage" :loading="isLoading">
                发送
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import { getDeepSeekResponse } from '../utils/ds'

const petImg = "https://cwwdka.oss-cn-beijing.aliyuncs.com/pet/girl.jpg";

interface Position { x: number; y: number }
interface Message { role: 'user' | 'assistant'; content: string }

const petPosition = reactive<Position>({ x: 200, y: 200 })
const showDialog = ref(false)
const userInput = ref('')
const messages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const isThinking = ref(false)

const movePet = (event: MouseEvent) => {
  petPosition.x = event.clientX - 40
  petPosition.y = event.clientY - 40
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  const userMessage = userInput.value.trim()
  userInput.value = ''
  messages.value.push({ role: 'user', content: userMessage })
  isLoading.value = true
  isThinking.value = true
  try {
    const response = await getDeepSeekResponse(
      userMessage, 
      "你是一位可爱的AI宠物",
    )
    messages.value.push({ role: 'assistant', content: response })
  } catch (error) {
    console.error('API调用失败:', error)
    ElMessage.error('聊天请求失败，请稍后重试')
    messages.value.push({ role: 'assistant', content: '抱歉，我现在无法回应，请稍后再试。' })
  } finally {
    isLoading.value = false
    isThinking.value = false
  }
}

watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

const handleClose = (done: () => void) => { done() }

onMounted(() => {
  document.addEventListener('mousemove', movePet)
  setTimeout(() => {
    messages.value.push({ role: 'assistant', content: '你好！我是AI之父吴越大王，点我就能和我聊天哦~' })
  }, 1000)
})

onUnmounted(() => { document.removeEventListener('mousemove', movePet) })
</script>

<style scoped>
/* 宠物容器 */
.pet-wrapper {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9999;
}

/* 宠物 */
.pet {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  transition: all 0.25s ease-out;
  cursor: pointer;
  pointer-events: auto;
}

.pet-body {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  transition: transform 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease;
  filter: drop-shadow(0 6px 6px rgba(0,0,0,0.25));
  animation: float 3s ease-in-out infinite;
}

.pet-body:hover {
  transform: scale(1.15) rotate(5deg);
  filter: drop-shadow(0 10px 12px rgba(0,0,0,0.35));
}

.pet-body::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(255,255,255,0.4),
    rgba(255,255,255,0.0) 70%
  );
  pointer-events: none;
  z-index: 2;
}

@keyframes float {
  0%, 100% { transform: translateY(0) }
  50% { transform: translateY(-6px) }
}

/* 思考气泡 */
.pet-talk-bubble {
  position: absolute;
  top: -45px;
  left: 45px;
  background: #fff;
  padding: 8px 14px;
  border-radius: 20px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  font-size: 13px;
  font-weight: 500;
  color: #555;
  animation: float 2s infinite ease-in-out;
  pointer-events: none;
}

/* 聊天容器 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 聊天内容区 - 保证可滚动 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  margin-bottom: 12px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fafafa;

  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f0f0f0;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background-color: #a0a0a0;
}

/* 每条消息 */
.message {
  display: flex;
  align-items: flex-end;
  margin-bottom: 12px;
}

.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }

/* 头像 */
.avatar {
  width: 35px;
  height: 35px;
  margin: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
}

/* 消息气泡 */
.message-content {
  max-width: 65%;
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.5;
  word-break: break-word;
}

.message.user .message-content {
  background: #1890ff;
  color: #fff;
  border-bottom-right-radius: 4px;
  order: 1;
}

.message.assistant .message-content {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
  order: 2;
}

.message.user .avatar { order: 2; }
.message.assistant .avatar { order: 1; }

/* 输入框 */
.chat-input {
  margin-top: auto;
  flex-shrink: 0;
}
</style>

<style>
/* 保证对话框可交互 */
.pet-dialog .el-dialog,
.pet-dialog .el-dialog__wrapper,
.pet-dialog .el-dialog__headerbtn,
.pet-dialog .el-input,
.pet-dialog .el-button {
  pointer-events: auto !important;
}

/* 调整对话框样式 */
.pet-dialog .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.pet-dialog .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  margin-right: 0;
}

/* 重点：固定 body 高度，内部自适应 */
.pet-dialog .el-dialog__body {
  padding: 20px;
  height: 500px; /* 可改成 70vh */
  display: flex;
  flex-direction: column;
}
</style>
