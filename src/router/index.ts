import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'

const routes = [
  { path: '/', component: VideoPlayer }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
