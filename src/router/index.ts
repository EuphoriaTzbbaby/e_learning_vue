import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'
import Login from '../pages/Login.vue'
const routes = [
  { path: '/', component: Login },
  {
    path: '/videoPlayer', name: 'videoPlayer', component: VideoPlayer
  },
  { path: '/login', component: Login }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
