<template>
  <div class="page-wrapper">
    <div class="register-container">
      <h2 class="title">学生注册</h2>
      <form @submit.prevent="onSubmit" class="register-form">
        <div class="form-group">
          <label class="label">用户名</label>
          <input
            v-model="form.username"
            placeholder="请输入用户名"
            type="text"
            class="input-field"
            required
          />
        </div>

        <div class="form-group">
          <label class="label">姓名</label>
          <input
            v-model="form.name"
            placeholder="请输入真实姓名"
            type="text"
            class="input-field"
            required
          />
        </div>

        <div class="form-group">
          <label class="label">邮箱</label>
          <input
            v-model="form.email"
            placeholder="请输入邮箱"
            type="email"
            class="input-field"
            required
          />
        </div>

        <div class="form-group">
          <label class="label">密码</label>
          <input
            v-model="form.password"
            placeholder="请输入密码（至少6位）"
            type="password"
            class="input-field"
            minlength="6"
            required
          />
        </div>

        <div class="form-group">
          <label class="label">确认密码</label>
          <input
            v-model="form.confirmPassword"
            placeholder="请再次输入密码"
            type="password"
            class="input-field"
            minlength="6"
            required
          />
        </div>

        <button type="submit" class="btn-register">注册</button>
        
        <div class="login-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import usersApi from '../api/users'
import type { Users } from '../interface/users'

const router = useRouter()

interface RegisterForm {
  username: string
  name: string
  email: string
  password: string
  confirmPassword: string
}

const form = reactive<RegisterForm>({
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const onSubmit = async () => {
  // 表单验证
  if (!form.username || !form.name || !form.email || !form.password || !form.confirmPassword) {
    alert('请填写完整注册信息')
    return
  }

  if (form.password !== form.confirmPassword) {
    alert('两次密码输入不一致')
    return
  }

  if (form.password.length < 6) {
    alert('密码长度至少为6位')
    return
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    alert('请输入有效的邮箱地址')
    return
  }

  try {
    // 准备注册数据
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const registerData: Partial<Users> = {
      username: form.username,
      password: form.password,
      name: form.name,
      email: form.email,
      role: 'student', // 固定为学生角色
      avatar: 'avatar.jpg', // 使用默认头像
      state: 1, // 默认状态为激活
      createdAt: currentTime,
      updatedAt: currentTime
    }

    const res = await usersApi.addUser(registerData)
    
    if (res.data) {
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      alert('注册失败：' + (res.data.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    alert('注册失败：' + (error.response?.data?.message || error.message || '请稍后重试'))
  }
}
</script>

<style scoped>
body, html {
  height: 100%;
  margin: 0;
  padding: 0;
  background: url('https://cwwdka.oss-cn-beijing.aliyuncs.com/e_learning/%E5%88%BB%E6%99%B4%20%E6%B6%82%E9%B8%A6%E5%A2%99%E8%83%8C%E6%99%AF%204K%E5%A3%81%E7%BA%B8%203840x2160_%E5%BD%BC%E5%B2%B8%E5%9B%BE%E7%BD%91.jpg') no-repeat center center fixed;
  background-size: cover;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.register-container {
  max-width: 420px;
  width: 100%;
  padding: 40px 32px;
  border-radius: 20px;
  
  /* 毛玻璃效果 */
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  
  /* 边框和阴影 */
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.title {
  text-align: center;
  margin-bottom: 32px;
  color: #fff;
  font-weight: 700;
  font-size: 32px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideIn 0.6s ease forwards;
  opacity: 0;
}

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.15s; }
.form-group:nth-child(3) { animation-delay: 0.2s; }
.form-group:nth-child(4) { animation-delay: 0.25s; }
.form-group:nth-child(5) { animation-delay: 0.3s; }

.label {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-left: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.input-field {
  padding: 14px 18px;
  font-size: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #333;
  font-weight: 500;
}

.input-field::placeholder {
  color: #999;
  font-weight: 400;
}

.input-field:focus {
  border-color: #409eff;
  box-shadow: 
    0 0 0 3px rgba(64, 158, 255, 0.15),
    0 2px 8px rgba(64, 158, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.input-field:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-register {
  margin-top: 10px;
  padding: 16px 0;
  font-weight: 700;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.btn-register::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-register:hover::before {
  left: 100%;
}

.btn-register:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.login-link {
  text-align: center;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.login-link a {
  color: #409eff;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.login-link a:hover {
  color: #66b1ff;
  border-bottom-color: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 32px 24px;
    margin: 20px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .input-field {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .btn-register {
    padding: 14px 0;
    font-size: 16px;
  }
}
</style>
