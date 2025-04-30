import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'
import Login from '../pages/Login.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import VideoList from '../views/VideoList.vue'
import VideoAlbumList from '../views/VideoAlbumList.vue'
import Love from '../views/amusement/loveYou.vue'
const routes = [
  { path: '/', redirect: '/admin/videoList' },
  { path: '/login', component: Login },
  { path: '/videoPlayer', name: 'videoPlayer', component: VideoPlayer },
  {
    path: '/love',
    name: 'love',
    component: Love
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: 'videoList',
        name: 'videoList',
        component: VideoList
      },
      {
        path: 'videoAlbumList',
        name: 'videoAlbumList',
        component: VideoAlbumList
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
