import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'
import Login from '../pages/Login.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import VideoList from '../views/VideoList.vue'
import VideoAlbumList from '../views/VideoAlbumList.vue'
import Love from '../views/amusement/loveYou.vue'
import StudentLayout from '../layouts/StudentLayout.vue'
import CourseList from '../views/CourseList.vue'
import Comment from '../views/Comment.vue'
import Reply from '../views/Reply.vue'
import Cf from '../views/amusement/Cf.vue'
import TeacherLayout from '../layouts/TeacherLayout.vue'
import TeacherVideoList from '../views/TeacherVideoList.vue'
import TeacherVideoAlbumList from '../views/TeacherVideoAlbumList.vue'
const routes = [
  { path: '/', redirect: 'login' },
  { path: '/login', component: Login },
  {
    path: '/cf',
    name: 'cf',
    component: Cf
  },
  {
    path: '/love',
    name: 'love',
    component: Love
  },
  {
    path: '/admin',
    name: 'admin',
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
      },
      {
        path: 'comment',
        name: 'comment',
        component: Comment
      },
      {
        path: 'reply',
        name: 'reply',
        component: Reply
      }
    ]
  },
  {
    path: '/teacher',
    name: 'teacher',
    component: TeacherLayout,
    children: [
      {
        path: 'teacherVideoList',
        name: 'teacherVideoList',
        component: TeacherVideoList
      },
      {
        path: 'teacherVideoAlbumList',
        name: 'teacherVideoAlbumList',
        component: TeacherVideoAlbumList
      }
    ]
  },
  {
    path: '/student',
    name: 'student',
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
