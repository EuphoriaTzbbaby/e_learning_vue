import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/tzb/api': {  // 匹配前端请求的前缀
        target: 'http://localhost:7788',  // 后端地址（无需包含/tzb/api）
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tzb\/api/, '')  // 可选，根据后端路径调整
      }
    }
  }
})
