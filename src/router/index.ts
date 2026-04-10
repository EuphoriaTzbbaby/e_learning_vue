import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import EnglishManage from '../views/admin/EnglishManage.vue'
import ReviewLogManage from '../views/admin/ReviewLogManage.vue'
import ReviewAnalytics from '../views/admin/ReviewAnalytics.vue'
import SystemConfig from '../views/admin/SystemConfig.vue'
import CourseManage from '../views/admin/CourseManage.vue' // 合集管理
import VideoList from '../views/class/VideoList.vue'
import VideoAlbumList from '../views/class/VideoAlbumList.vue'
import Love from '../views/amusement/loveYou.vue'
import StudentLayout from '../layouts/StudentLayout.vue'
import CourseList from '../views/class/CourseList.vue'
import Comment from '../views/class/Comment.vue'
import Reply from '../views/class/Reply.vue'
import UserList from '../views/class/UserList.vue'
import Cf from '../views/amusement/Cf.vue'
import TeacherLayout from '../layouts/TeacherLayout.vue'
import TeacherVideoList from '../views/class/TeacherVideoList.vue'
import TeacherVideoAlbumList from '../views/class/TeacherVideoAlbumList.vue'
import English from '../views/class/English.vue'
import EnglishGame from '../views/class/EnglishGame.vue'
import Game from '../views/class/Game.vue'
import XHSLayout from '../layouts/XHSLayout.vue'
import Notes from '../views/xhs/notes.vue'
import NoteComments from '../views/xhs/noteComments.vue'
import Emotion from '../views/xhs/emotion.vue'
import IpLocation from '../views/xhs/ipLocation.vue'
import Gender from '../views/xhs/gender.vue'
import EnglishGamePro from '../views/class/EnglishGamePro.vue'
import Wordle from '../views/class/Wordle.vue'
import Review from '../views/class/review.vue'
import AiReading from '../views/class/AiReading.vue'
import Sort from '../views/class/Sort.vue'
import EnglishWordFreq from '../views/class/EnglishWordFreq.vue'
import Profile from '../views/class/Profile.vue'
// @ts-ignore 忽略类型检查，因为Vue文件没有类型声明
import TestDs from '../views/class/TestDs.vue'
const routes = [
  { path: '/', redirect: 'login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/profile', redirect: '/student/profile' },
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
    path: '/xhs',
    name: 'xhs',
    component: XHSLayout,
    children: [
      {
        path: 'notes',
        name: 'notes',
        component: Notes
      },
      {
        path: 'noteComments',
        name: 'noteComments',
        component: NoteComments
      },
      {
        path: 'emotion',
        name: 'emotion',
        component: Emotion
      },
      {
        path: 'ipLocation',
        name: 'ipLocation',
        component: IpLocation
      },
      {
        path: 'gender',
        name: 'gender',
        component: Gender
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'adminDashboard',
        component: Dashboard
      },
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
      },
      {
        path: 'users',
        name: 'users',
        component: UserList
      },
      {
        path: 'english',
        name: 'englishManage',
        component: EnglishManage
      },
      {
        path: 'reviewLogs',
        name: 'reviewLogs',
        component: ReviewLogManage
      },
      {
        path: 'reviewAnalytics',
        name: 'reviewAnalytics',
        component: ReviewAnalytics
      },
      {
        path: 'systemConfig',
        name: 'systemConfig',
        component: SystemConfig
      },
      {
        path: 'testDs',
        name: 'testDs',
        component: TestDs
      },
      {
        path: 'courseManage',
        name: 'courseManage',
        component: CourseManage // 合集管理
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
        path : 'sort',
        name: 'sort',
        component: Sort
      },
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
      {
        path: 'english',
        name: 'english',
        component: English
      },
      {
        path: 'englishWordFreq',
        name: 'englishWordFreq',
        component: EnglishWordFreq
      },
      {
        path: 'englishGame',
        name: 'englishGame',
        component: EnglishGame
      },
      {
        path: 'englishGamePro',
        name: 'englishGamePro',
        component: EnglishGamePro
      },
      {
        path: 'wordle',
        name: 'wordle',
        component: Wordle
      },
      {
        path: 'game',
        name: 'game',
        component: Game
      },
      {
        path: 'review',
        name: 'review',
        component: Review
      },
      {
        path: 'aiReading',
        name: 'aiReading',
        component: AiReading
      },
      {
        path: 'profile',
        name: 'profile',
        component: Profile
      },
      {
        path: 'testDs',
        name: 'testDs',
        component: TestDs
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
