import { createRouter, createWebHistory } from 'vue-router'
import VideoPlayer from '../pages/VideoPlayer.vue'
import Login from '../pages/Login.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import VideoList from '../views/class/VideoList.vue'
import VideoAlbumList from '../views/class/VideoAlbumList.vue'
import Love from '../views/amusement/loveYou.vue'
import StudentLayout from '../layouts/StudentLayout.vue'
import CourseList from '../views/class/CourseList.vue'
import Comment from '../views/class/Comment.vue'
import Reply from '../views/class/Reply.vue'
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
      {
        path: 'english',
        name: 'english',
        component: English
      },
      {
        path: 'englishGame',
        name: 'englishGame',
        component: EnglishGame
      },
      {
        path: 'game',
        name: 'game',
        component: Game
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
