import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {

  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/tzb/api': {  // 匹配前端请求的前缀
          target: "http://42.101.42.177:7788/tzb",  // 动态读取后端地址
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tzb\/api/, '')  // 根据后端路径调整
        }
      }
    }
  }
})
