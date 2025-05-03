import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()) as Record<string, string>
  console.log('VITE_API_BASE_URL =', env.VITE_API_URL)

  return {
    plugins: [vue()],
    server: {
      proxy: {
        // 代理 Codeforces API
        '/cf-api': {
          target: 'https://codeforces.com/api',  // Codeforces 官方 API 地址
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cf-api/, ''),
        },
        // 代理你自己的后端 API（可选）
        '/tzb/api': {
          target: env.VITE_API_URL,  // 你的后端 API 地址
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tzb\/api/, ''),
        },
      },
    },
  }
})