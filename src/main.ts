import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus' // 引入 Element Plus
import 'element-plus/dist/index.css'
import GlobalChat from '../src/components/cwwChat.vue'
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.component('GlobalChat', GlobalChat) // 注册全局聊天组件
app.mount('#app') // 将Vue应用挂载到id为app的DOM元素上
