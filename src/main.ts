import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// 完整引入（简单粗暴，体积大）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router/index'
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
