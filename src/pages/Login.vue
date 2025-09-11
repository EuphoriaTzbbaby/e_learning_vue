<template>
    <div class="page-wrapper">
      <div class="login-container">
        <h2 class="title">登录</h2>
        <form @submit.prevent="onSubmit" class="login-form">
          <input
            v-model="form.email"
            placeholder="邮箱"
            type="email"
            style="width: 100%; padding: 8px; box-sizing: border-box;"
          />
          <input
            v-model="form.password"
            placeholder="密码"
            type="password"
            class="input-field"
            autocomplete="current-password"
          />
          <select v-model="form.role" class="input-field select-field">
            <option value="" disabled>请选择角色</option>
            <option value="student">学生</option>
            <option value="admin">管理员</option>
            <option value="teacher">教师</option>
          </select>
          <button type="submit" class="btn-login">登录</button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, onMounted } from 'vue'
  import { post } from '../utils/axios/index'
  import router from '../router'
  import { getDeepSeekResponse} from '../utils/ds'
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
  
  function onSubmit() {
    if (!form.email || !form.password || !form.role) {
      alert('请填写完整登录信息')
      return
    }
    console.log('登录信息', form)
// 发送登录请求
    post('/users/check', {
        email: form.email,
        password: form.password,
        role: form.role
      }).then(res => {
        // 根据后端返回的数据做处理
        console.log('登录结果', res.data)
        if (res.data) {
          alert(`登录成功！欢迎用户：${form.email}`)
          localStorage.setItem('user', JSON.stringify(res.data))
          router.push({
            name : form.role
          })
          // 这里可以做跳转或者存储登录状态
        } else {
          alert(`登录失败：${res.data.message || '未知错误'}`)
        }
      }).catch(err => {
        alert('请求失败，请稍后重试')
        console.error(err)
      })
  }
  const fuck = async () => {
    try {
      // 单个消息
    const singleResponse = await getDeepSeekResponse(
      "请用中文解释一下机器学习",
      "你是一位AI教育专家"
    );
    console.log('AI回复:', singleResponse);
    // const messages = [
    //   "什么是深度学习？",
    //   "Transformer模型是什么？",
    //   "推荐一些学习AI的书籍"
    // ];
    
    // const responses = await batchChat(messages, "请用简洁的语言回答");
    // console.log('批量回复:', responses);
    
  } catch (error) {
    console.error('批量处理失败:', error);
  }
}
  onMounted(() => {
    fuck()
    // alert("目前先选student进行登录, 账号格式为 userx@example.com, 密码格式为 passx, x 取值为[1, 8, 9, 16, 18, 19, 20], 看后台管理把当前url后缀login改成admin")
    console.log("cnm777")
    document.title = 'E_learning平台'
  })
  </script>
  
  <style>
  body, html {
    height: 100%;
    margin: 0;
    padding: 0;
    background: url('https://cwwdka.oss-cn-beijing.aliyuncs.com/e_learning/%E5%88%BB%E6%99%B4%20%E6%B6%82%E9%B8%A6%E5%A2%99%E8%83%8C%E6%99%AF%204K%E5%A3%81%E7%BA%B8%203840x2160_%E5%BD%BC%E5%B2%B8%E5%9B%BE%E7%BD%91.jpg') no-repeat center center fixed;
    background-size: cover;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .page-wrapper {
    height: 100vh;  /* 视口高度 */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
.login-container {
  max-width: 360px;
  width: 90%;
  padding: 32px 24px;
  border-radius: 16px;

  /* 关键：背景更透明 */
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);

  /* 细边框+阴影 */
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);

  animation: fadeInUp 0.6s ease forwards;
}


  
  .title {
    text-align: center;
    margin-bottom: 24px;
    color: #333;
    font-weight: 700;
    font-size: 28px;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .input-field {
    padding: 12px 16px;
    font-size: 16px;
    border: 1.8px solid #ccc;
    border-radius: 8px;
    outline-offset: 2px;
    transition: border-color 0.3s ease;
  }
  
  .input-field:focus {
    border-color: #409eff;
    box-shadow: 0 0 6px #409eff;
  }
  
  .select-field {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3csvg fill=\'%23409eff\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cpath d=\'M7 10l5 5 5-5z\'/%3e%3c/svg%3e');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px 16px;
    padding-right: 50px;
    cursor: pointer;
  }
  
  .btn-login {
    padding: 14px 0;
    font-weight: 600;
    font-size: 18px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    color: white;
    cursor: pointer;
    user-select: none;
    transition: background 0.3s ease;
  }
  
  .btn-login:hover {
    background: linear-gradient(90deg, #66b1ff, #409eff);
  }
  
  .btn-login:active {
    background: #3584e4;
    box-shadow: inset 0 3px 5px rgba(0,0,0,0.2);
  }
  </style>
  