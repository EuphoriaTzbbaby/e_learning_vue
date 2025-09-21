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
      title="🐾 与AI之父吴越聊天" 
      width="580px"
      :before-close="handleClose"
      class="pet-dialog"
      :show-close="false"
      :close-on-click-modal="false"
      top="8vh"
    >
      <template #header="{ close }">
        <div class="custom-dialog-header">
          <div class="dialog-title">
            <img :src="petImg" alt="pet" class="dialog-pet-avatar" />
            <span class="dialog-title-text">🐾 与AI之父吴越聊天</span>
          </div>
          <el-button 
            @click="close" 
            class="dialog-close-btn"
            circle
            size="small"
          >
            ✕
          </el-button>
        </div>
      </template>
      <div class="chat-container">
        <!-- 聊天内容 -->
        <el-scrollbar class="chat-messages" ref="messagesContainer">
          <div class="messages-wrapper">
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
        </el-scrollbar>
        
        <!-- 输入框 -->
        <div class="chat-input">
          <el-input
            v-model="userInput"
            placeholder="和宠物说点什么吧..."
            size="large"
            @keyup.enter="sendMessage"
          >
            <template #append>
              <el-button style = "margin-left : 10px" type="primary" :icon="Promotion" @click="sendMessage" :loading="isLoading">
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
const targetPosition = reactive<Position>({ x: 200, y: 200 })
const showDialog = ref(false)
const userInput = ref('')
const messages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const isThinking = ref(false)
const isMoving = ref(false)

// 宠物跟随鼠标的优化逻辑
const movePet = (event: MouseEvent) => {
  const mouseX = event.clientX - 40
  const mouseY = event.clientY - 40
  
  // 生成随机角度（0到2π）
  const randomAngle = Math.random() * 2 * Math.PI
  
  // 计算在133px圆形边界上的随机位置
  const radius = 133
  const offsetX = Math.cos(randomAngle) * radius
  const offsetY = Math.sin(randomAngle) * radius
  
  // 设置目标位置为鼠标位置加上随机偏移
  targetPosition.x = mouseX + offsetX
  targetPosition.y = mouseY + offsetY
  
  if (!isMoving.value) {
    smoothMovePet()
  }
}

// 平滑移动宠物
const smoothMovePet = () => {
  isMoving.value = true
  
  const animate = () => {
    const dx = targetPosition.x - petPosition.x
    const dy = targetPosition.y - petPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 2) {
      // 使用缓动函数实现平滑移动
      petPosition.x += dx * 0.08
      petPosition.y += dy * 0.08
      
      // 添加移动时的CSS类
      const petElement = document.querySelector('.pet')
      if (petElement) {
        petElement.classList.add('moving')
      }
      
      requestAnimationFrame(animate)
    } else {
      petPosition.x = targetPosition.x
      petPosition.y = targetPosition.y
      isMoving.value = false
      
      // 移除移动时的CSS类
      const petElement = document.querySelector('.pet')
      if (petElement) {
        petElement.classList.remove('moving')
      }
    }
  }
  
  animate()
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  const userMessage = userInput.value.trim()
  userInput.value = ''
  messages.value.push({ role: 'user', content: userMessage })
  await scrollToBottom() // 发送用户消息后滚动到底部
  
  isLoading.value = true
  isThinking.value = true
  try {
    const response = await getDeepSeekResponse(
      userMessage, 
      "你是一位可爱的AI宠物",
    )
    messages.value.push({ role: 'assistant', content: response })
    await scrollToBottom() // 收到AI回复后滚动到底部
  } catch (error) {
    console.error('API调用失败:', error)
    ElMessage.error('聊天请求失败，请稍后重试')
    messages.value.push({ role: 'assistant', content: '抱歉，我现在无法回应，请稍后再试。' })
    await scrollToBottom() // 错误消息后也滚动到底部
  } finally {
    isLoading.value = false
    isThinking.value = false
  }
}

// 滚动到底部的函数
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    const scrollbar = messagesContainer.value as any
    if (scrollbar.setScrollTop && scrollbar.wrapRef) {
      scrollbar.setScrollTop(scrollbar.wrapRef.scrollHeight)
    }
  }
}

// 监听消息变化，自动滚动到底部
watch(messages, scrollToBottom, { deep: true })

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
  width: 90px;
  height: 90px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  pointer-events: auto;
  z-index: 10;
}

.pet::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.pet:hover::before {
  opacity: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
}

.pet-body {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
  animation: float 4s ease-in-out infinite;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.3);
}

.pet-body:hover {
  transform: scale(1.2) rotate(8deg);
  filter: drop-shadow(0 12px 24px rgba(0,0,0,0.3));
  box-shadow: 0 0 30px rgba(64, 158, 255, 0.6);
  border-color: rgba(64, 158, 255, 0.8);
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
    circle at 25% 25%,
    rgba(255,255,255,0.6) 0%,
    rgba(255,255,255,0.3) 30%,
    rgba(255,255,255,0.0) 70%
  );
  pointer-events: none;
  z-index: 2;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  25% { 
    transform: translateY(-8px) rotate(2deg); 
  }
  50% { 
    transform: translateY(-12px) rotate(0deg); 
  }
  75% { 
    transform: translateY(-8px) rotate(-2deg); 
  }
}

/* 宠物移动时的特效 */
.pet.moving {
  animation: float 2s ease-in-out infinite, wiggle 0.5s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(3deg); }
  75% { transform: rotate(-3deg); }
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

/* 自定义对话框头部 */
.custom-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  width: 100%;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-pet-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #409eff;
}

.dialog-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  background: linear-gradient(45deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dialog-close-btn {
  background: #f56c6c !important;
  border: none !important;
  color: white !important;
  transition: all 0.3s ease;
}

.dialog-close-btn:hover {
  background: #f78989 !important;
  transform: scale(1.1);
}

/* 聊天容器 - 上下分离布局 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满对话框高度 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
}

/* 聊天内容区 - 占据剩余空间，可滚动 */
.chat-messages {
  flex: 1; /* 占据剩余空间 */
  margin: 0;
  border-radius: 16px 16px 0 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: inset 0 2px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
  height: 0; /* 重要：设置为0让flex生效 */
  min-height: 0; /* 重要：允许收缩 */
}

.chat-messages :deep(.el-scrollbar__wrap) {
  height: 100%;
  overflow-y: auto;
}

.chat-messages :deep(.el-scrollbar__view) {
  height: auto;
  min-height: 100%;
  display: block;
}

.messages-wrapper {
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}

/* 自定义scrollbar样式 */
.chat-messages :deep(.el-scrollbar__bar.is-vertical .el-scrollbar__thumb) {
  background-color: #409eff;
  border-radius: 4px;
}

.chat-messages :deep(.el-scrollbar__bar.is-vertical) {
  width: 8px;
  right: 2px;
}

.chat-messages :deep(.el-scrollbar__thumb:hover) {
  background-color: #36a3f7;
}

/* 每条消息 */
.message {
  display: flex;
  align-items: flex-end;
  margin-bottom: 16px;
  animation: messageSlideIn 0.4s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }

/* 头像 */
.avatar {
  width: 40px;
  height: 40px;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.avatar img:hover {
  transform: scale(1.1);
}

.message.user .avatar::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid #fff;
}

.message.assistant .avatar::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #409eff;
  border-radius: 50%;
  border: 2px solid #fff;
}

/* 消息气泡 */
.message-content {
  max-width: 70%;
  padding: 12px 18px;
  border-radius: 20px;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.message-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.message.user .message-content {
  background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
  color: #fff;
  border-bottom-right-radius: 6px;
  order: 1;
}

.message.user .message-content::before {
  content: '';
  position: absolute;
  right: -8px;
  bottom: 8px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-left-color: #409eff;
}

.message.assistant .message-content {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  color: #333;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 6px;
  order: 2;
}

.message.assistant .message-content::before {
  content: '';
  position: absolute;
  left: -9px;
  bottom: 8px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-right-color: #fff;
}

.message.user .avatar { order: 2; }
.message.assistant .avatar { order: 1; }

/* 输入框 - 固定在底部 */
.chat-input {
  flex-shrink: 0; /* 不允许收缩 */
  background: rgba(255, 255, 255, 0.98);
  border-radius: 0 0 16px 16px;
  padding: 20px 24px;
  box-shadow: 0 -4px 20px rgba(102, 126, 234, 0.15);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(102, 126, 234, 0.1);
  border-top: 2px solid rgba(102, 126, 234, 0.2);
  position: relative;
}

.chat-input :deep(.el-input-group) {
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-input :deep(.el-input-group):hover {
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.chat-input :deep(.el-input__wrapper) {
  border-radius: 30px 0 0 30px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.chat-input :deep(.el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4);
  background: rgba(255, 255, 255, 1);
}

.chat-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 1);
}

.chat-input :deep(.el-input-group__append) {
  border-radius: 0 30px 30px 0;
  border: none;
  padding: 0;
}

.chat-input :deep(.el-input-group__append .el-button) {
  border-radius: 0 30px 30px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 14px 24px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.chat-input :deep(.el-input-group__append .el-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.chat-input :deep(.el-input-group__append .el-button:hover::before) {
  left: 100%;
}

.chat-input :deep(.el-input-group__append .el-button:hover) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.chat-input :deep(.el-input__inner) {
  padding: 14px 20px;
  font-size: 15px;
  line-height: 1.5;
  color: #2c3e50;
  font-weight: 500;
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
  padding: 0; /* 移除内边距，让聊天容器占满空间 */
  height: 600px; /* 增加高度以提供更好的聊天体验 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */
  background: transparent;
}

/* 确保对话框内容区域占满整个空间 */
.pet-dialog .el-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.pet-dialog .el-dialog__header {
  padding: 20px 20px 0 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
}

.pet-dialog .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 18px;
}
</style>
