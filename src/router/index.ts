import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'
import Login from '../pages/Login.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import VideoList from '../views/VideoList.vue'
import VideoAlbumList from '../views/VideoAlbumList.vue'
import Love from '../views/amusement/loveYou.vue'
import StudentLayout from '../layouts/StudentLayout.vue'
import CourseList from '../views/CourseList.vue'
import component from 'element-plus/es/components/tree-select/src/tree-select-option.mjs'
const routes = [
  { path: '/', redirect: 'videoPlayer' },
  { path: '/login', component: Login },
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
  },
  {
    path: '/student',
    component: StudentLayout,
    children: [
      {
        path: 'courseList',
        name: 'courseList',
        component: CourseList
      },
      {
        path: 'videoPlayer',
        name: 'videoPlayer',
        component: VideoPlayer
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
