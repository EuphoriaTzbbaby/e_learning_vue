<template>
  <div class="login-page">
    <!-- 动态背景 -->
    <div class="bg-animation">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 class="brand-name">E-Learning</h1>
        <p class="brand-tagline">学英语 · 每一天</p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="onSubmit" class="login-form">
        <!-- 邮箱 -->
        <div class="input-group" :class="{ 'focused': focusedField === 'email', 'has-value': form.email }">
          <label class="input-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="input-field"
            @focus="focusedField = 'email'"
            @blur="focusedField = null"
            autocomplete="email"
          />
        </div>

        <!-- 密码 -->
        <div class="input-group" :class="{ 'focused': focusedField === 'password', 'has-value': form.password }">
          <label class="input-label">密码</label>
          <div class="password-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="input-field"
              @focus="focusedField = 'password'"
              @blur="focusedField = null"
              autocomplete="current-password"
            />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 角色选择 -->
        <div class="input-group select-group" :class="{ 'focused': focusedField === 'role', 'has-value': form.role }">
          <label class="input-label">角色</label>
          <select v-model="form.role" class="input-field select-field">
            <option value="" disabled>请选择角色</option>
            <option value="student">普通用户</option>
            <option value="admin">系统管理员</option>
          </select>
        </div>



        <!-- 登录按钮 -->
        <button type="submit" class="btn-login" :class="{ 'loading': loading }" :disabled="loading">
          <span class="btn-text">{{ loading ? '登录中...' : '登 录' }}</span>
          <span class="btn-loader" v-if="loading"></span>
        </button>

        <!-- 注册链接 -->
        <p class="register-hint">
          还没有账号？<router-link to="/register" class="register-link">立即注册</router-link>
        </p>
      </form>
    </div>

    <!-- 版权信息 -->
    <p class="copyright">© 2026 E-Learning Platform. All rights reserved.</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { post } from '../utils/axios/index'
import router from '../router'

interface LoginForm {
  email: string
  password: string
  role: 'student' | 'admin' | 'teacher' | ''
}

const form = reactive<LoginForm>({
  email: '',
  password: '',
  role: ''
})

const focusedField = ref<string | null>(null)
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)

async function onSubmit() {
  if (!form.email || !form.password || !form.role) {
    alert('请填写完整登录信息')
    return
  }

  loading.value = true

  try {
    const res = await post('/users/check', {
      email: form.email,
      password: form.password,
      role: form.role
    })

    if (res.data) {
      if (res.data.state === 1) {
        alert('您的账号已被禁用，请联系管理员')
        return
      }

      // 记住我
      if (rememberMe.value) {
        localStorage.setItem('rememberedEmail', form.email)
      }

      alert('欢迎回来！')
      localStorage.setItem('user', JSON.stringify(res.data))
      setTimeout(() => {
        router.push({ name: form.role })
      }, 1000)
    } else {
      alert('登录失败：' + (res.data.message || '未知错误'))
    }
  } catch (err) {
    alert('请求失败，请稍后重试')
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 恢复记住的邮箱
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  if (rememberedEmail) {
    form.email = rememberedEmail
    rememberMe.value = true
  }

  document.title = '登录 - E-Learning平台'
})
</script>

<style scoped>
/* 基础布局 */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 动态背景光球 */
.bg-animation {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -150px;
  right: -100px;
  animation-delay: -5s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(50px, -50px) scale(1.1); }
  50% { transform: translate(0, 50px) scale(1); }
  75% { transform: translate(-50px, -25px) scale(0.9); }
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 48px 40px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 10px 40px rgba(102, 126, 234, 0.6); }
}

.logo-icon svg {
  width: 36px;
  height: 36px;
  color: white;
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tagline {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  letter-spacing: 4px;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-group {
  position: relative;
}

.input-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.input-group.focused .input-label {
  color: #667eea;
}

.input-field {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  color: white;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.input-field:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

/* 密码输入框 */
.password-wrapper {
  position: relative;
}

.password-wrapper .input-field {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: white;
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

/* 选择框 */
.select-group .input-field {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 18px;
  padding-right: 44px;
}

.select-group .input-field option {
  background: #1a1a2e;
  color: white;
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -8px;
}

/* 复选框 */
.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.remember-me input {
  display: none;
}

.remember-me .checkmark {
  width: 18px;
  height: 18px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  position: relative;
  transition: all 0.3s ease;
}

.remember-me input:checked + .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.remember-me input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* 忘记密码链接 */
.forgot-link {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #818cf8;
}

/* 登录按钮 */
.btn-login {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-top: 8px;
}

.btn-login::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.btn-login:hover::before {
  left: 100%;
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-login.loading {
  background: linear-gradient(135deg, #4f4f4f 0%, #6b6b6b 100%);
}

.btn-text {
  position: relative;
  z-index: 1;
  letter-spacing: 2px;
}

/* 按钮加载动画 */
.btn-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 注册提示 */
.register-hint {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #818cf8;
}

/* 版权信息 */
.copyright {
  position: fixed;
  bottom: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  z-index: 1;
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    padding: 36px 24px;
    border-radius: 20px;
  }

  .brand-name {
    font-size: 24px;
  }

  .logo-icon {
    width: 56px;
    height: 56px;
  }

  .input-field {
    padding: 12px 14px;
    font-size: 14px;
  }

  .btn-login {
    padding: 14px;
    font-size: 15px;
  }

  .copyright {
    display: none;
  }
}
</style>
