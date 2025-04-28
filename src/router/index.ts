import { createRouter, createWebHistory } from 'vue-router'
import CNM from "../components/cnm.vue"
const routes = [
  { path: '/', redirect: '/cnm' },
  {
    path: '/cnm',
    component: CNM
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
