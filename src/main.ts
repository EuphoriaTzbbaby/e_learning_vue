import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus' // 引入 Element Plus
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import GlobalChat from '../src/components/cwwChat.vue'

type ThemeMode = 'light' | 'dark'

const getChinaHour = () => {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    hour12: false
  }).formatToParts(new Date())
  const h = parts.find((p) => p.type === 'hour')?.value
  const n = h ? Number(h) : NaN
  return Number.isFinite(n) ? n : new Date().getHours()
}

const getDefaultThemeByChinaTime = (): ThemeMode => {
  const h = getChinaHour()
  return h >= 7 && h < 19 ? 'light' : 'dark'
}

const savedTheme = localStorage.getItem('theme')
const theme: ThemeMode = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : getDefaultThemeByChinaTime()
localStorage.setItem('theme', theme)
document.documentElement.classList.toggle('dark', theme === 'dark')
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.component('GlobalChat', GlobalChat) // 注册全局聊天组件
app.mount('#app') // 将Vue应用挂载到id为app的DOM元素上
