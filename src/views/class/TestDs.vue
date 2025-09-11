<template>
  <div class="container">
    <header>
      <h1>DeepSeek AI 测试页面</h1>
      <p>测试与DeepSeek AI的交互功能</p>
    </header>

    <div class="content">
      <!-- 聊天测试 -->
      <div class="test-section">
        <h3>测试AI聊天功能</h3>

        <div class="input-group">
          <label for="systemPrompt">给 ds 的提示（可选）</label>
          <input 
            type="text" 
            id="systemPrompt" 
            v-model="systemPrompt" 
            placeholder="例如：你是一位AI教育专家"
          >
        </div>

        <div class="input-group">
          <label for="message">消息内容</label>
          <textarea 
            id="message" 
            v-model="message" 
            placeholder="输入您想发送的消息..."
          ></textarea>
        </div>

        <button 
          class="btn" 
          @click="testChat" 
          :disabled="loading"
        >
          <span v-if="loading">
            <div class="spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
            请求中...
          </span>
          <span v-else>发送消息</span>
        </button>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>正在与AI交流，请稍候...</p>
        </div>

        <div v-if="response" class="response-box">
          <h4>AI回复：</h4>
          <div class="message ai-message">{{ response }}</div>
        </div>

        <div v-if="error" class="error">
          <strong>错误：</strong> {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { getDeepSeekResponse } from "../../utils/ds";
const message = ref("");
const systemPrompt = ref("你是一位AI教育专家");
const response = ref("");
const presetResponse = ref("");
const loading = ref(false);
const error = ref("");


const testChat = async () => {
  if (!message.value) {
    error.value = "请输入消息内容";
    return;
  }
  loading.value = true;
  error.value = "";
  response.value = "";

  try {
    const result = await getDeepSeekResponse(
      message.value,
      systemPrompt.value
    );
    response.value = result.data;
  } catch (err) {
    error.value = err.message || "请求失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 20px;
}
.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
header {
  background: linear-gradient(90deg, #4b6cb7 0%, #182848 100%);
  color: white;
  padding: 20px;
  text-align: center;
}
header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}
header p {
  opacity: 0.8;
}
.content {
  padding: 25px;
}
.test-section {
  margin-bottom: 30px;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #4b6cb7;
}
.test-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}
.btn {
  background: #4b6cb7;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn:hover {
  background: #3a5795;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.response-box {
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4b6cb7;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.message {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.user-message {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}
.ai-message {
  background-color: #f1f8e9;
  border-left: 4px solid #8bc34a;
}
.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 6px;
  margin-top: 10px;
}
.input-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2c3e50;
}
input, textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}
textarea {
  min-height: 100px;
  resize: vertical;
}
</style>
